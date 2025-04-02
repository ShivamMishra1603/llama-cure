import React, { useState, useRef } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Paper, 
  Tooltip, 
  CircularProgress,
  Modal,
  Typography,
  Button,
  Fab
} from '@mui/material';
import { 
  Send, 
  Mic, 
  MicOff, 
  AddPhotoAlternate,
  Close 
} from '@mui/icons-material';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onSendAudio: (audioBlob: Blob) => Promise<void>;
  onSendImage: (imageBlob: Blob, prompt: string) => Promise<void>;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onSendAudio, 
  onSendImage, 
  isLoading 
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle sending text message
  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle starting audio recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Stop all audio tracks
        stream.getAudioTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0) {
          onSendAudio(audioBlob);
        }
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds += 1;
        setRecordingTime(seconds);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Handle stopping audio recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setRecordingTime(0);
    }
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle capturing image from webcam
  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setCameraActive(false);
    }
  };

  // Handle uploading image from file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle sending image
  const handleSendImage = async () => {
    if (capturedImage && imagePrompt.trim()) {
      try {
        // Convert base64 to blob
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        await onSendImage(blob, imagePrompt);
        
        // Reset state
        handleCloseImageModal();
      } catch (error) {
        console.error('Error sending image:', error);
      }
    }
  };

  // Close image modal and reset state
  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setCapturedImage(null);
    setImagePrompt('');
    setCameraActive(false);
  };

  return (
    <>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          position: 'sticky', 
          bottom: 0,
          borderRadius: '16px',
          marginTop: 2,
          backgroundColor: 'background.paper',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ marginRight: '8px' }}
          >
            <Tooltip title="Send image">
              <IconButton 
                color="primary" 
                onClick={() => setImageModalOpen(true)} 
                disabled={isLoading}
                sx={{ mb: 1 }}
              >
                <AddPhotoAlternate />
              </IconButton>
            </Tooltip>
          </motion.div>
          
          <TextField
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading || isRecording}
            InputProps={{
              sx: { borderRadius: '24px', pr: 1 },
            }}
          />
          
          {isRecording ? (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Typography variant="body2" color="error" sx={{ mr: 1 }}>
                  {formatTime(recordingTime)}
                </Typography>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconButton color="error" onClick={handleStopRecording}>
                  <MicOff />
                </IconButton>
              </motion.div>
            </Box>
          ) : (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ marginLeft: '8px' }}
            >
              <Tooltip title="Record audio message">
                <IconButton 
                  color="primary" 
                  onClick={handleStartRecording} 
                  disabled={isLoading}
                >
                  <Mic />
                </IconButton>
              </Tooltip>
            </motion.div>
          )}
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ marginLeft: '8px' }}
          >
            <Tooltip title="Send message">
              <span>
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage} 
                  disabled={!message.trim() || isLoading || isRecording}
                >
                  {isLoading ? <CircularProgress size={24} /> : <Send />}
                </IconButton>
              </span>
            </Tooltip>
          </motion.div>
        </Box>
      </Paper>
      
      {/* Image Upload Modal */}
      <Modal
        open={imageModalOpen}
        onClose={handleCloseImageModal}
        aria-labelledby="image-upload-modal"
        aria-describedby="upload-or-capture-an-image"
      >
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '70%', md: '60%', lg: '50%' },
            maxWidth: '600px',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              {capturedImage ? 'Add description for image' : 'Add an image'}
            </Typography>
            <IconButton onClick={handleCloseImageModal}>
              <Close />
            </IconButton>
          </Box>
          
          {capturedImage ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <img 
                  src={capturedImage} 
                  alt="Selected"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Describe what you want to know about this image"
                variant="outlined"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                margin="normal"
                multiline
                rows={2}
                required
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button variant="outlined" onClick={() => setCapturedImage(null)}>
                  Choose different image
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSendImage}
                  disabled={!imagePrompt.trim()}
                >
                  Send
                </Button>
              </Box>
            </>
          ) : (
            <>
              {cameraActive ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'environment' }}
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px'
                    }}
                  />
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => setCameraActive(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleCapture}
                    >
                      Capture
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    component="label"
                    startIcon={<AddPhotoAlternate />}
                  >
                    Upload from device
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageUpload}
                    />
                  </Button>
                  
                  <Typography variant="body2" sx={{ my: 1 }}>- or -</Typography>
                  
                  <Button 
                    variant="outlined"
                    onClick={() => setCameraActive(true)}
                  >
                    Use camera
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Modal>
    </>
  );
};

export default ChatInput; 