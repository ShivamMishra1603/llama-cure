import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import chat_router, voice_router, vision_router
from backend.config.config import HOST, PORT, DEBUG

app = FastAPI(
    title="Llama Cure",
    description="A Llama-powered medical chatbot with voice and vision capabilities using the llama-3.2-90b-vision-preview model via Groq API",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(voice_router, prefix="/api/voice", tags=["voice"])
app.include_router(vision_router, prefix="/api/vision", tags=["vision"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Llama Cure API",
        "version": "0.1.0",
        "model": "llama-3.2-90b-vision-preview",
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=DEBUG) 