import os
import uuid
import tempfile
import numpy as np
import speech_recognition as sr
from typing import Optional
import soundfile as sf
import sounddevice as sd
from httpx import Client
from gtts import gTTS  # Import Google Text-to-Speech
from backend.config.config import GROQ_API_KEY

class SpeechModel:
    def __init__(self):
        """
        Initialize the speech model for transcription and synthesis.
        """
        self.recognizer = sr.Recognizer()
        self.audio_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "audio_files")
        
        # Create audio directory if it doesn't exist
        if not os.path.exists(self.audio_dir):
            os.makedirs(self.audio_dir)
    
    def transcribe_audio(self, audio_file_path: str) -> str:
        """
        Transcribe audio file to text.
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            Transcription text
        """
        try:
            with sr.AudioFile(audio_file_path) as source:
                audio_data = self.recognizer.record(source)
                # Use Google's speech recognition (could be replaced with a medical-specific model)
                transcription = self.recognizer.recognize_google(audio_data)
                return transcription
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return f"Error transcribing audio: {str(e)}"
    
    def synthesize_speech(self, text: str) -> str:
        """
        Convert text to speech using Google's Text-to-Speech API.
        
        Args:
            text: Text to convert to speech
            
        Returns:
            Path to the generated audio file
        """
        try:
            # Generate a unique audio file name
            audio_file_name = f"speech_{uuid.uuid4()}.mp3"
            audio_file_path = os.path.join(self.audio_dir, audio_file_name)
            
            # Use Google TTS to generate speech
            tts = gTTS(text=text, lang='en', slow=False)
            
            # Save the audio file
            tts.save(audio_file_path)
            
            print(f"Speech file generated at: {audio_file_path}")
            return audio_file_path
            
        except Exception as e:
            print(f"Error synthesizing speech: {str(e)}")
            return f"Error synthesizing speech: {str(e)}" 