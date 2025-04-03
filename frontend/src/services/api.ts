import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Types
export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  max_tokens?: number;
  concise?: boolean;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
}

export interface TranscriptionResponse {
  transcription: string;
}

export interface ImageAnalysisResponse {
  analysis: string;
  conversation_id: string;
}

// Chat API methods
export const chatService = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const updatedRequest = {
      ...request,
      concise: true,
      max_tokens: 150,
      temperature: 0.7,
      system_prompt: "You are a medical assistant providing VERY brief responses. Keep all answers under 100 words. Be direct and focused. Avoid lengthy explanations."
    };
    const response = await api.post('/api/chat/', updatedRequest);
    return response.data;
  }
};

// Voice API methods
export const voiceService = {
  transcribeAudio: async (audioBlob: Blob): Promise<TranscriptionResponse> => {
    const formData = new FormData();
    
    // Get the mime type from the blob
    const contentType = audioBlob.type || 'audio/webm';
    
    // Append with correct filename extension based on mimetype
    const getExtension = (mime: string) => {
      if (mime.includes('wav')) return '.wav';
      if (mime.includes('mp3') || mime.includes('mpeg')) return '.mp3';
      if (mime.includes('mp4')) return '.mp4';
      if (mime.includes('ogg')) return '.ogg';
      if (mime.includes('aac')) return '.aac';
      if (mime.includes('webm')) return '.webm';
      return '.webm'; // Default extension
    };
    
    const filename = `audio${getExtension(contentType)}`;
    console.log(`Sending audio with type: ${contentType}, filename: ${filename}`);
    
    formData.append('audio', audioBlob, filename);
    
    const response = await api.post('/api/voice/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  synthesizeSpeech: async (text: string): Promise<string> => {
    const formData = new FormData();
    formData.append('text', text);
    
    const response = await api.post('/api/voice/synthesize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
    
    return URL.createObjectURL(response.data);
  }
};

// Vision API methods
export const visionService = {
  analyzeImage: async (imageBlob: Blob, prompt: string, conversation_id?: string): Promise<ImageAnalysisResponse> => {
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('prompt', prompt);
    
    if (conversation_id) {
      formData.append('conversation_id', conversation_id);
    }
    
    const response = await api.post('/api/vision/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
};

export default api; 