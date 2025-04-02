import React, { useRef, useEffect } from 'react';
import { Box, Container, Typography, Button, Divider, IconButton, Tooltip } from '@mui/material';
import { DeleteForever, VolumeUp, VolumeOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useChatContext } from '../../context/ChatContext';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';

const ChatContainer: React.FC = () => {
  const { 
    messages, 
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
  } = useChatContext();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Welcome message if no messages
  const showWelcomeMessage = messages.length === 0;
  
  return (
    <Container maxWidth="md" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <motion.span
            animate={{ rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 0.5, delay: 1, repeat: 0 }}
          >
            🩺
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            LlamaCure
          </motion.span>
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isMuted ? "Enable voice responses" : "Mute voice responses"}>
            <IconButton 
              onClick={toggleMute} 
              color={isMuted ? "default" : "primary"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Tooltip>
          
          {audioPlaying && (
            <Tooltip title="Stop audio playback">
              <IconButton 
                onClick={stopAudio} 
                color="error"
                aria-label="Stop audio"
                size="small"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Stop Audio
                </motion.div>
              </IconButton>
            </Tooltip>
          )}
          
          {messages.length > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteForever />}
                onClick={clearConversation}
                size="small"
              >
                Clear Chat
              </Button>
            </motion.div>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        {showWelcomeMessage ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box 
              sx={{ 
                textAlign: 'center', 
                my: 8,
                px: 2,
                py: 4,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              >
                <Typography variant="h5" color="primary.main" gutterBottom>
                  👋 Welcome to LlamaCure
                </Typography>
              </motion.div>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                Your AI medical assistant powered by Llama 3.2 Vision model
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: '600px', mx: 'auto' }}>
                <Typography variant="body2" color="text.secondary">
                  You can:
                </Typography>
                <Box component="ul" sx={{ textAlign: 'left', pl: 2 }}>
                  <Typography component="li" variant="body2">Ask medical questions</Typography>
                  <Typography component="li" variant="body2">Upload medical images for analysis</Typography>
                  <Typography component="li" variant="body2">Send voice messages</Typography>
                  <Typography component="li" variant="body2">Listen to responses as speech</Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>
        ) : (
          messages.map((message) => (
            <MessageItem 
              key={message.id} 
              message={message} 
              onPlayAudio={playTextAsAudio}
              isMuted={isMuted}
              audioPlaying={audioPlaying}
              stopAudio={stopAudio}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      <ChatInput 
        onSendMessage={sendTextMessage}
        onSendAudio={sendAudioMessage}
        onSendImage={sendImageMessage}
        isLoading={isLoading}
      />
    </Container>
  );
};

export default ChatContainer; 