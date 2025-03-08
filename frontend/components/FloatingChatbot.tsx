import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import { Close, Minimize, OpenInFull, QuestionAnswer, Send, ThumbDown, ThumbUp } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: string;
  suggested_follow_ups?: string[];
}

const FloatingChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(() => {
    const chatbotWidth = 350;
    const chatbotHeight = 500;
    const margin = 20;
    
    return {
      x: Math.max(margin, Math.min(window.innerWidth - chatbotWidth - margin, window.innerWidth - 400)),
      y: Math.max(margin, Math.min(window.innerHeight - chatbotHeight - margin, window.innerHeight - 550))
    };
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatIconRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

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
    const userMessage: Message = {
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
      const assistantMessage: Message = {
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
      const errorMessage: Message = {
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = async (messageId: string, feedbackType: string) => {
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

  const handleFollowUpClick = (question: string) => {
    setInput(question);
  };

  const toggleChat = () => {
    setIsAnimating(true);
    
    if (isOpen) {
      // When closing, animate out and then set isOpen to false
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 300); // Match the animation duration
    } else {
      // When opening, set isOpen to true and ensure it's positioned correctly
      setIsOpen(true);
      
      // Ensure the chatbot is positioned in a visible area when opened
      setTimeout(() => {
        ensureVisiblePosition();
        setIsAnimating(false);
      }, 50);
    }
  };

  const toggleMinimize = () => {
    // Start animation
    setIsAnimating(true);
    
    // When minimizing, close the chat window and show the icon after animation
    if (!isMinimized) {
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 300); // Match the animation duration
    } else {
      setIsMinimized(false);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof Element && e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - dragPosition.x,
        y: e.clientY - dragPosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (isDragging) {
      // Calculate new position
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Get actual chatbot dimensions if available, otherwise use defaults
      const chatbotElement = chatbotRef.current;
      const chatbotWidth = chatbotElement ? chatbotElement.offsetWidth : 350;
      const chatbotHeight = chatbotElement ? chatbotElement.offsetHeight : 500;
      const margin = 20;
      
      // Constrain X position
      const constrainedX = Math.max(margin, Math.min(newX, window.innerWidth - chatbotWidth - margin));
      
      // Constrain Y position
      const constrainedY = Math.max(margin, Math.min(newY, window.innerHeight - chatbotHeight - margin));
      
      setDragPosition({
        x: constrainedX,
        y: constrainedY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Ensure the chatbot is positioned in a visible area after dragging
    ensureVisiblePosition();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Function to ensure the chatbot is positioned in a visible area
  const ensureVisiblePosition = () => {
    const chatbotElement = chatbotRef.current;
    const chatbotWidth = chatbotElement ? chatbotElement.offsetWidth : 350;
    const chatbotHeight = chatbotElement ? chatbotElement.offsetHeight : 500;
    const margin = 20;
    
    // Calculate a position that ensures visibility
    const x = Math.min(
      Math.max(margin, dragPosition.x),
      window.innerWidth - chatbotWidth - margin
    );
    
    const y = Math.min(
      Math.max(margin, dragPosition.y),
      window.innerHeight - chatbotHeight - margin
    );
    
    // Update position if needed
    if (x !== dragPosition.x || y !== dragPosition.y) {
      setDragPosition({ x, y });
    }
  };

  // Update the resize handler to use the ensureVisiblePosition function
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        ensureVisiblePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, dragPosition]);

  // Call ensureVisiblePosition when the chatbot is opened
  useEffect(() => {
    if (isOpen) {
      ensureVisiblePosition();
    }
  }, [isOpen]);

  // Call ensureVisiblePosition on component mount to ensure initial position is valid
  useEffect(() => {
    ensureVisiblePosition();
  }, []);

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
            boxShadow: 3,
            animation: isAnimating ? 'popIn 0.3s ease-in-out' : 'none',
            '@keyframes popIn': {
              '0%': { transform: 'scale(0.5)', opacity: 0 },
              '100%': { transform: 'scale(1)', opacity: 1 }
            }
          }}
        >
          <QuestionAnswer />
        </IconButton>
      ) : (
        <div 
          ref={chatbotRef}
          style={{ 
            position: 'fixed',
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
            zIndex: 1000,
            cursor: isDragging ? 'grabbing' : 'auto',
            animation: isAnimating ? 'fadeOut 0.3s ease-in-out' : 'none',
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? 'scale(0.8)' : 'scale(1)',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
          }}
          onMouseDown={handleMouseDown}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              width: 350, 
              height: isMinimized ? 'auto' : 500, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
              resize: 'both',
              boxShadow: 3,
              transition: 'height 0.3s ease',
            }}
          >
            {/* Chat Header - Drag Handle */}
            <Box 
              className="drag-handle"
              sx={{ 
                p: 2, 
                backgroundColor: 'primary.main', 
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'move',
              }}
            >
              <Typography variant="h6">CRM Assistant</Typography>
              <Box>
                <IconButton 
                  size="small" 
                  onClick={toggleMinimize} 
                  sx={{ color: 'white', mr: 1 }}
                  title="Minimize to chat icon"
                >
                  <Minimize fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={toggleChat} 
                  sx={{ color: 'white' }}
                  title="Close chat"
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            {/* Chat Messages */}
            {!isMinimized && (
              <Box 
                sx={{ 
                  p: 2, 
                  flexGrow: 1, 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  backgroundColor: '#f5f5f5',
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
                        backgroundColor: message.role === 'user' ? 'secondary.light' : 'white',
                        boxShadow: 1,
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
            )}
            
            {/* Chat Input */}
            {!isMinimized && (
              <Box 
                sx={{ 
                  p: 2, 
                  borderTop: '1px solid', 
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 1,
                  backgroundColor: 'white',
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type your message..."
                  size="small"
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button 
                  variant="contained" 
                  color="primary"
                  endIcon={<Send />}
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                >
                  Send
                </Button>
              </Box>
            )}
          </Paper>
        </div>
      )}
    </Box>
  );
};

export default FloatingChatbot; 