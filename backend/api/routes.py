from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import shutil
from backend.models.llama_model import LlamaModel, VisionModel
from backend.models.speech_model import SpeechModel

# Initialize models
llama_model = LlamaModel()
vision_model = VisionModel()
speech_model = SpeechModel()

# Pydantic models for request validation
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    concise: Optional[bool] = False
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str

# Routers
chat_router = APIRouter()
voice_router = APIRouter()
vision_router = APIRouter()

@chat_router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Process a text chat message through the Llama model.
    """
    try:
        # Pass additional parameters for concise responses
        generation_options = {}
        
        # Handle concise mode
        if request.concise:
            generation_options["max_tokens"] = request.max_tokens or 150
            generation_options["temperature"] = request.temperature or 0.7
            
            # Add a system prompt for concise responses if not provided
            if not request.system_prompt:
                generation_options["system_prompt"] = "You are a medical assistant providing brief, concise responses. Keep all answers under 100 words. Be direct and focus on the most important information."
            else:
                generation_options["system_prompt"] = request.system_prompt
        
        response, conversation_id = llama_model.generate_response(
            request.message, 
            request.conversation_id,
            **generation_options
        )
        return {"response": response, "conversation_id": conversation_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@voice_router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe uploaded audio to text.
    """
    try:
        # Create temporary directory if it doesn't exist
        temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp")
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
            
        # Save temporary audio file
        temp_file_path = os.path.join(temp_dir, f"temp_audio_{os.urandom(8).hex()}.wav")
        with open(temp_file_path, "wb") as f:
            content = await audio.read()
            f.write(content)
        
        # Transcribe audio
        transcription = speech_model.transcribe_audio(temp_file_path)
        
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        return {"transcription": transcription}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@vision_router.post("/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    conversation_id: Optional[str] = Form(None)
):
    """
    Analyze an image with an optional text prompt using vision capabilities.
    """
    try:
        # Create temporary directory if it doesn't exist
        temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp")
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
            
        # Save temporary image file
        temp_file_path = os.path.join(temp_dir, f"temp_image_{os.urandom(8).hex()}.jpg")
        with open(temp_file_path, "wb") as f:
            content = await image.read()
            f.write(content)
        
        # Process image with vision model
        analysis, conversation_id = vision_model.analyze_image(
            temp_file_path, prompt, conversation_id
        )
        
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        return {"analysis": analysis, "conversation_id": conversation_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@voice_router.post("/synthesize")
async def synthesize_speech(text: str = Form(...)):
    """
    Convert text to speech using Google's Text-to-Speech.
    """
    try:
        # Generate audio file
        audio_file_path = speech_model.synthesize_speech(text)
        
        # Return the audio file
        return FileResponse(
            audio_file_path, 
            media_type="audio/mpeg",  # Changed from audio/wav to audio/mpeg for MP3
            filename=os.path.basename(audio_file_path)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 