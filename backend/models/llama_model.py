import os
import uuid
import json
import base64
from typing import Tuple, Optional, Dict, List, Union
import httpx
from groq import Groq
from backend.config.config import GROQ_API_KEY, GROQ_MODEL

class LlamaModel:
    def __init__(self):
        """
        Initialize the Llama model for medical conversation using Groq API.
        """
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = GROQ_MODEL
        self.conversations: Dict[str, List[Dict]] = {}
        
    def generate_response(self, message: str, conversation_id: Optional[str] = None) -> Tuple[str, str]:
        """
        Generate a response using the Llama model via Groq API.
        
        Args:
            message: The user's message
            conversation_id: Optional conversation ID for maintaining context
            
        Returns:
            Tuple of (response_text, conversation_id)
        """
        # Create new conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            self.conversations[conversation_id] = []
        
        # Get or create conversation history
        conversation = self.conversations.get(conversation_id, [])
        
        # Prepare messages for the model
        messages = [
            {
                "role": "system", 
                "content": """You are LlamaCure, a helpful medical assistant. 
You can provide general medical information and guidance, but always remind users to consult healthcare professionals for proper diagnosis and treatment. 
You should be accurate, compassionate, and clear in your responses. 
If you're unsure about something, acknowledge your limitations and avoid making definitive claims."""
            }
        ]
        
        # Add conversation history
        for turn in conversation:
            messages.append(turn)
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        try:
            # Generate response
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
                top_p=0.9
            )
            
            response_text = response.choices[0].message.content
            
            # Update conversation history
            conversation.append({"role": "user", "content": message})
            conversation.append({"role": "assistant", "content": response_text})
            self.conversations[conversation_id] = conversation
            
            return response_text, conversation_id
            
        except Exception as e:
            print(f"Error generating response: {e}")
            return f"Error generating response: {str(e)}", conversation_id

class VisionModel:
    def __init__(self):
        """
        Initialize the vision model for medical image analysis using Groq API.
        """
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = GROQ_MODEL
        self.conversations: Dict[str, List[Dict]] = {}
        
    def analyze_image(self, image_path: str, prompt: str, conversation_id: Optional[str] = None) -> Tuple[str, str]:
        """
        Analyze an image with an optional text prompt.
        
        Args:
            image_path: Path to the image file
            prompt: Text prompt for the image analysis
            conversation_id: Optional conversation ID for maintaining context
            
        Returns:
            Tuple of (analysis_text, conversation_id)
        """
        # Create new conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            self.conversations[conversation_id] = []
        
        # Get or create conversation history
        conversation = self.conversations.get(conversation_id, [])
        
        try:
            # Read and encode the image
            with open(image_path, "rb") as image_file:
                image_bytes = image_file.read()
                base64_image = base64.b64encode(image_bytes).decode('utf-8')
            
            # Create the message with the image and medical context in the prompt
            content = [
                {
                    "type": "text", 
                    "text": f"You are a helpful medical assistant. Analyze this medical image and provide detailed information. Remember to be accurate, compassionate, and clear. Remind the user to consult healthcare professionals for proper diagnosis and treatment. {prompt}"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                }
            ]
            
            # No system message - put medical context in the user message instead
            messages = []
            
            # Add conversation history (text-only parts)
            for turn in conversation:
                if isinstance(turn["content"], str):
                    messages.append(turn)
            
            # Add current message with image
            messages.append({"role": "user", "content": content})
            
            # Generate response
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
                top_p=0.9
            )
            
            analysis_text = response.choices[0].message.content
            
            # Update conversation history (store text-only version for history)
            conversation.append({"role": "user", "content": prompt})
            conversation.append({"role": "assistant", "content": analysis_text})
            self.conversations[conversation_id] = conversation
            
            return analysis_text, conversation_id
            
        except Exception as e:
            print(f"Error analyzing image: {e}")
            return f"Error analyzing image: {str(e)}", conversation_id 