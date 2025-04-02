import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Model Configuration
USE_GROQ = os.getenv("USE_GROQ", "True").lower() == "true"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.2-90b-vision-preview")

# Server Configuration
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# Validate critical configurations
if USE_GROQ and not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY must be set when USE_GROQ is True") 