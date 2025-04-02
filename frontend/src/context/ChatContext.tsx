import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { chatService, voiceService, visionService } from '../services/api';

// Define the message types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  imageUrl?: string;
  audioUrl?: string;
  audioLoading?: boolean;
}

// Define the context type
interface ChatContextType {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  isMuted: boolean;
  audioPlaying: boolean;
  stopAudio: () => void;
  toggleMute: () => void;
  sendTextMessage: (text: string) => Promise<void>;
  sendAudioMessage: (audioBlob: Blob) => Promise<void>;
  sendImageMessage: (imageBlob: Blob, prompt: string) => Promise<void>;
  playTextAsAudio: (text: string, messageId?: string) => Promise<void>;
  clearConversation: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Hook for using the chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);

  // Initialize audio element
  React.useEffect(() => {
    const audio = new Audio();
    
    // Set up audio event listeners
    audio.onplay = () => setAudioPlaying(true);
    audio.onended = () => setAudioPlaying(false);
    audio.onpause = () => setAudioPlaying(false);
    
    setAudioElement(audio);
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      setAudioPlaying(false);
    }
  }, [audioElement]);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted && audioPlaying) {
        stopAudio();
      }
      return newMuted;
    });
  }, [audioPlaying, stopAudio]);

  // Generate a unique ID for messages
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add a message to the conversation
  const addMessage = (role: MessageRole, content: string, isLoading = false, imageUrl?: string, audioUrl?: string, audioLoading?: boolean) => {
    const newMessage: Message = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      isLoading,
      imageUrl,
      audioUrl,
      audioLoading
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    return newMessage;
  };

  // Update a message
  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    );
  };

  // Play text as audio with option to associate with a message
  const playTextAsAudio = async (text: string, messageId?: string) => {
    if (!audioElement || isMuted) return;
    
    try {
      // If there's a messageId, set the message to loading audio state
      if (messageId) {
        updateMessage(messageId, { audioLoading: true });
      }
      
      const audioUrl = await voiceService.synthesizeSpeech(text);
      
      // Update the message with audio URL if provided
      if (messageId) {
        updateMessage(messageId, { audioUrl, audioLoading: false });
      }
      
      // Only play if not muted
      if (!isMuted) {
        audioElement.src = audioUrl;
        audioElement.play().catch(err => console.error('Error playing audio:', err));
      }
    } catch (error) {
      console.error('Error playing text as audio:', error);
      if (messageId) {
        updateMessage(messageId, { audioLoading: false });
      }
    }
  };

  // Send a text message
  const sendTextMessage = async (text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    addMessage('user', text);
    
    try {
      // Add a loading message for the assistant
      const loadingMessage = addMessage('assistant', 'Thinking...', true, undefined, undefined, false);
      
      // Call the API to get a response
      const response = await chatService.sendMessage({
        message: text,
        conversation_id: conversationId
      });
      
      // Update the conversation ID if needed
      setConversationId(response.conversation_id);
      
      // First update with content, but keep loading state for audio
      updateMessage(loadingMessage.id, {
        content: response.response,
        isLoading: false,
        audioLoading: true
      });

      // Then generate and play audio, linking it to this message
      await playTextAsAudio(response.response, loadingMessage.id);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage(
        'assistant',
        'Sorry, I encountered an error processing your request. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Send an audio message - similar pattern as above
  const sendAudioMessage = async (audioBlob: Blob) => {
    setIsLoading(true);
    
    try {
      // Create an object URL for the audio blob
      const audioUrl = URL.createObjectURL(audioBlob);
      const userMessage = addMessage('user', 'Audio message', false, undefined, audioUrl);
      
      // Add a loading message for the assistant
      const loadingMessage = addMessage('assistant', 'Transcribing audio...', true);
      
      // Transcribe the audio
      const transcription = await voiceService.transcribeAudio(audioBlob);
      
      // Update the user message with the transcription
      updateMessage(userMessage.id, {
        content: transcription.transcription
      });
      
      // Process the transcribed text like a regular text message
      const response = await chatService.sendMessage({
        message: transcription.transcription,
        conversation_id: conversationId
      });
      
      // Update conversation ID
      setConversationId(response.conversation_id);
      
      // Update content but keep audio loading
      updateMessage(loadingMessage.id, {
        content: response.response,
        isLoading: false,
        audioLoading: true
      });

      // Generate and play audio for this message
      await playTextAsAudio(response.response, loadingMessage.id);
    } catch (error) {
      console.error('Error processing audio message:', error);
      addMessage(
        'assistant',
        'Sorry, I encountered an error processing your audio. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Send an image message - similar pattern
  const sendImageMessage = async (imageBlob: Blob, prompt: string) => {
    setIsLoading(true);
    
    try {
      // Create an object URL for the image blob
      const imageUrl = URL.createObjectURL(imageBlob);
      
      // Add the user message with image
      addMessage('user', prompt, false, imageUrl);
      
      // Add a loading message for the assistant
      const loadingMessage = addMessage('assistant', 'Analyzing image...', true);
      
      // Process the image - fix the conversion issue with conversationId
      const response = await visionService.analyzeImage(
        imageBlob, 
        prompt, 
        conversationId || undefined
      );
      
      // Update conversation ID
      setConversationId(response.conversation_id);
      
      // Update content but keep audio loading
      updateMessage(loadingMessage.id, {
        content: response.analysis,
        isLoading: false,
        audioLoading: true
      });

      // Generate and play audio for this message
      await playTextAsAudio(response.analysis, loadingMessage.id);
    } catch (error) {
      console.error('Error processing image message:', error);
      addMessage(
        'assistant',
        'Sorry, I encountered an error analyzing your image. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
    stopAudio();
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        conversationId,
        isLoading,
        isMuted,
        audioPlaying,
        stopAudio,
        toggleMute,
        sendTextMessage,
        sendAudioMessage,
        sendImageMessage,
        playTextAsAudio,
        clearConversation
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext; 