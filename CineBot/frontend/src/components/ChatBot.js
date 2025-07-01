// src/components/Chatbot.js - Updated Authorization Logic
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming you have an auth context
import '../styles/ChatBot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm CineBot. Ask me anything about movies, actors, directors, or get recommendations!", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth(); // Get the authenticated user if available

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { id: messages.length + 1, text: input, isBot: false };
    setMessages([...messages, userMessage]);
    
    // Clear input
    setInput('');
    
    // Show loading indicator
    setIsLoading(true);
    
    try {
      // Prepare conversation history with proper role mapping for Cohere API
      const conversationHistory = messages.map(msg => ({
        role: msg.isBot ? 'Chatbot' : 'User',
        message: msg.text
      }));
      
      // Prepare headers without authentication if user is not logged in
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Only add authorization header if user is logged in and has a token
      if (user && user.token) {
        headers['Authorization'] = `Token ${user.token}`;
      }
      
      // Send message to backend API
      const response = await fetch('http://127.0.0.1:8000/api/chatbot/message/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          message: input,
          conversation_history: conversationHistory
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get response from chatbot: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add bot response
      const botMessage = { id: messages.length + 2, text: data.response, isBot: true };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      // Add error message
      const errorMessage = { 
        id: messages.length + 2, 
        text: "Sorry, I'm having trouble connecting. Please try again later.", 
        isBot: true 
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to convert markdown-like formatting in messages
  const formatMessage = (text) => {
    // Replace **text** with <strong>text</strong>
    const boldText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace newlines with <br> tags
    const formattedText = boldText.replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot toggle button */}
      <button 
        className="chatbot-toggle" 
        onClick={toggleChatbot}
        aria-label={isOpen ? 'Close movie chat' : 'Open movie chat'}
      >
        {isOpen ? (
          // Close icon (X)
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          // Movie chat icon (film icon)
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="2" y1="7" x2="7" y2="7"></line>
            <line x1="2" y1="17" x2="7" y2="17"></line>
            <line x1="17" y1="17" x2="22" y2="17"></line>
            <line x1="17" y1="7" x2="22" y2="7"></line>
          </svg>
        )}
      </button>
      
      {/* Chatbot dialog */}
      {isOpen && (
        <div className="chatbot-dialog">
          <div className="chatbot-header">
            <h3>CineBot</h3>
            <p className="chatbot-subheader">Your AI movie expert. Ask about films, directors, actors, or get recommendations!</p>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.isBot ? 'bot' : 'user'}`}
              >
                {message.isBot ? (
                  <>
                    <div className="bot-avatar">🎬</div>
                    <div className="message-content">
                      {formatMessage(message.text)}
                    </div>
                  </>
                ) : (
                  <div className="message-content">
                    {message.text}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="message bot">
                <div className="bot-avatar">🎬</div>
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chatbot-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about any movie, actor, or director..."
              aria-label="Type your message"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;