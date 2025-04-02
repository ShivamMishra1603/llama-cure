import React from 'react';
import { Avatar, Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { Message } from '../../context/ChatContext';

interface MessageItemProps {
  message: Message;
  onPlayAudio: (text: string, messageId?: string) => void;
  isMuted?: boolean;
  audioPlaying?: boolean;
  stopAudio?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  onPlayAudio, 
  isMuted = false,
  audioPlaying = false,
  stopAudio = () => {} 
}) => {
  const isUser = message.role === 'user';
  
  // Format timestamp
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(message.timestamp);

  // Determine if this message's audio is loading
  const isAudioLoading = message.audioLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: '16px' }}
    >
      <Box sx={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start', width: '100%' }}>
        <Avatar 
          sx={{ 
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            marginRight: isUser ? 0 : 2,
            marginLeft: isUser ? 2 : 0
          }}
        >
          {isUser ? 'U' : 'AI'}
        </Avatar>
        
        <Card 
          variant="outlined" 
          sx={{ 
            maxWidth: '70%',
            bgcolor: isUser ? 'primary.light' : 'background.paper',
            borderRadius: '18px',
            borderTopLeftRadius: isUser ? '18px' : '4px',
            borderTopRightRadius: isUser ? '4px' : '18px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent sx={{ padding: '12px 16px !important' }}>
            {message.isLoading ? (
              <Box display="flex" justifyContent="center" sx={{ py: 1 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                {message.imageUrl && (
                  <Box sx={{ mb: 2 }}>
                    <img 
                      src={message.imageUrl} 
                      alt="User uploaded" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </Box>
                )}
                
                {message.audioUrl && (
                  <Box sx={{ mb: 2 }}>
                    <audio 
                      controls 
                      src={message.audioUrl} 
                      style={{ width: '100%' }}
                    />
                  </Box>
                )}
                
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                
                {isAudioLoading && !isUser && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <CircularProgress size={20} color="secondary" />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
      
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          mt: 0.5, 
          mr: isUser ? 2 : 0, 
          ml: isUser ? 0 : 2 
        }}
      >
        {formattedTime}
      </Typography>
    </motion.div>
  );
};

export default MessageItem; 