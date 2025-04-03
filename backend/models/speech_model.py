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
import subprocess
import wave
from pydub import AudioSegment
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
    
    def convert_to_wav(self, audio_file_path: str) -> str:
        """
        Convert audio file to WAV format for compatibility with speech recognition
        
        Args:
            audio_file_path: Path to the original audio file
            
        Returns:
            Path to the converted WAV file
        """
        try:
            # Get file extension
            file_ext = os.path.splitext(audio_file_path)[1].lower()
            
            # If it's already a .wav file, just return the path
            if file_ext == '.wav':
                return audio_file_path
                
            # Create a temporary WAV file
            temp_wav_path = audio_file_path + "_converted.wav"
            
            # Convert audio using pydub
            try:
                audio = AudioSegment.from_file(audio_file_path)
                audio.export(temp_wav_path, format="wav")
                print(f"Successfully converted {file_ext} to WAV using pydub")
                return temp_wav_path
            except Exception as e:
                print(f"Pydub conversion failed: {e}, trying ffmpeg directly")
                
                # Fallback to ffmpeg directly
                try:
                    cmd = [
                        'ffmpeg',
                        '-i', audio_file_path,
                        '-acodec', 'pcm_s16le',
                        '-ar', '16000',
                        '-ac', '1',
                        temp_wav_path
                    ]
                    subprocess.check_call(cmd, stderr=subprocess.STDOUT)
                    print(f"Successfully converted {file_ext} to WAV using ffmpeg")
                    return temp_wav_path
                except Exception as ffmpeg_error:
                    print(f"ffmpeg conversion failed: {ffmpeg_error}")
                    raise Exception(f"Could not convert audio format {file_ext} to WAV") 
        
        except Exception as e:
            print(f"Error converting audio: {e}")
            return audio_file_path  # Return original path as fallback
    
    def transcribe_audio(self, audio_file_path: str) -> str:
        """
        Transcribe audio file to text.
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            Transcription text
        """
        try:
            # First convert to WAV if needed
            wav_file_path = self.convert_to_wav(audio_file_path)
            
            with sr.AudioFile(wav_file_path) as source:
                print(f"Processing audio file: {wav_file_path}")
                audio_data = self.recognizer.record(source)
                # Use Google's speech recognition (could be replaced with a medical-specific model)
                transcription = self.recognizer.recognize_google(audio_data)
                
                # Clean up temporary file if it was created during conversion
                if wav_file_path != audio_file_path and os.path.exists(wav_file_path):
                    try:
                        os.remove(wav_file_path)
                    except:
                        pass
                
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