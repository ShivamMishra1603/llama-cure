# Llama Cure Backend

A FastAPI-based backend for the Llama Cure medical chatbot, leveraging the `llama-3.2-90b-vision-preview` model via Groq's API.

## Features

- Text-based medical chat using Llama 3.2 90B
- Vision capabilities for analyzing medical images
- Voice transcription and speech synthesis

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Groq API key

3. Run the server:
   ```bash
   python main.py
   ```

## API Endpoints

- `GET /`: Welcome message
- `POST /api/chat/`: Text chat endpoint
- `POST /api/vision/analyze`: Image analysis endpoint
- `POST /api/voice/transcribe`: Voice transcription endpoint
- `POST /api/voice/synthesize`: Text-to-speech endpoint

## Environment Variables

- `GROQ_API_KEY`: Your Groq API key
- `GROQ_MODEL`: The model to use (default: "llama-3.2-90b-vision-preview")
- `USE_GROQ`: Whether to use Groq API (default: True)
- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: "0.0.0.0")
- `DEBUG`: Enable debug mode (default: True) 