import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import { ChatProvider } from './context/ChatContext';
import ChatContainer from './components/chat/ChatContainer';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChatProvider>
        <ChatContainer />
      </ChatProvider>
    </ThemeProvider>
  );
};

export default App;
