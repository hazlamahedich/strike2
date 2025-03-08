import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, TextField, Button, Typography, Avatar, IconButton, Chip, CircularProgress } from '@mui/material';
import { Send as SendIcon, ThumbUp, ThumbDown, QuestionAnswer } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Generate a session ID if one doesn't exist
    if (!sessionId) {
      setSessionId(uuidv4());
    }
  }, [sessionId]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message to the chat
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send the message to the API
      const response = await axios.post('/api/chatbot/chat', {
        session_id: sessionId,
        message: input,
      });

      // Add the assistant's response to the chat
      const assistantMessage = {
        id: response.data.message_id || uuidv4(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        suggested_follow_ups: response.data.suggested_follow_ups || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update the session ID if it's a new session
      if (response.data.session_id && !sessionId) {
        setSessionId(response.data.session_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add an error message
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = async (messageId, feedbackType) => {
    try {
      await axios.post('/api/chatbot/feedback', {
        session_id: sessionId,
        message_id: messageId,
        feedback_type: feedbackType,
      });
      
      // Update the message to show feedback was given
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, feedback: feedbackType } 
            : msg
        )
      );
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const handleFollowUpClick = (question) => {
    setInput(question);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      {!isOpen ? (
        <IconButton 
          onClick={toggleChat}
          sx={{ 
            backgroundColor: 'primary.main', 
            color: 'white',
            '&:hover': { backgroundColor: 'primary.dark' },
            width: 60,
            height: 60,
          }}
        >
          <QuestionAnswer />
        </IconButton>
      ) : (
        <Paper 
          elevation={3} 
          sx={{ 
            width: 350, 
            height: 500, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Chat Header */}
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: 'primary.main', 
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">CRM Assistant</Typography>
            <IconButton size="small" onClick={toggleChat} sx={{ color: 'white' }}>
              <Typography variant="body2">×</Typography>
            </IconButton>
          </Box>
          
          {/* Chat Messages */}
          <Box 
            sx={{ 
              p: 2, 
              flexGrow: 1, 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {messages.length === 0 && (
              <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="body1" color="text.secondary">
                  How can I help you today?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Ask me about the CRM features, troubleshooting, or any other questions.
                </Typography>
              </Box>
            )}
            
            {messages.map((message) => (
              <Box 
                key={message.id}
                sx={{ 
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: message.role === 'user' ? 'secondary.main' : 'primary.main',
                    width: 32,
                    height: 32,
                  }}
                >
                  {message.role === 'user' ? 'U' : 'A'}
                </Avatar>
                
                <Box 
                  sx={{ 
                    maxWidth: '70%',
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: message.role === 'user' ? 'secondary.light' : 'grey.100',
                  }}
                >
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                  
                  {message.role === 'assistant' && !message.feedback && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleFeedback(message.id, 'helpful')}
                        sx={{ color: 'success.main' }}
                      >
                        <ThumbUp fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleFeedback(message.id, 'not_helpful')}
                        sx={{ color: 'error.main' }}
                      >
                        <ThumbDown fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  
                  {message.role === 'assistant' && message.feedback && (
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
                      Feedback submitted
                    </Typography>
                  )}
                  
                  {message.role === 'assistant' && message.suggested_follow_ups && message.suggested_follow_ups.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {message.suggested_follow_ups.map((question, index) => (
                        <Chip 
                          key={index}
                          label={question}
                          size="small"
                          onClick={() => handleFollowUpClick(question)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
            
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main',
                    width: 32,
                    height: 32,
                  }}
                >
                  A
                </Avatar>
                <CircularProgress size={20} />
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>
          
          {/* Chat Input */}
          <Box 
            sx={{ 
              p: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              size="small"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <Button 
              variant="contained" 
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              Send
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Chatbot; 