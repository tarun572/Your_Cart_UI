/**
 * Chatbot Component - Main chatbot UI and interactions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text } from 'grommet';
import { Send, Chat } from 'grommet-icons';
import { chatbotService, Message } from '../services/chatbotService';

interface ChatbotProps {
  userRole?: 'buyer' | 'seller';
  cartCount?: number;
}

export default function Chatbot({ userRole = 'buyer', cartCount = 0 }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chatbot
  useEffect(() => {
    const history = chatbotService.loadHistory();
    if (history.length === 0) {
      // First time - show greeting
      const greeting = chatbotService.getGreeting(userRole);
      setMessages([greeting]);
    } else {
      setMessages(history);
    }
  }, [userRole]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || inputValue.trim();
      if (!messageText) return;

      setInputValue('');
      setIsLoading(true);

      try {
        const responses = await chatbotService.processMessage(messageText, { userRole, cartCount });
        setMessages(prev => [...prev, ...responses]);
      } catch (error) {
      } finally {
        setIsLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    },
    [inputValue, userRole, cartCount]
  );

  const handleQuickReply = (action: string) => {
    handleSendMessage(action);
  };

  const handleClearChat = () => {
    chatbotService.clearHistory();
    const greeting = chatbotService.getGreeting(userRole);
    setMessages([greeting]);
  };

  if (!isOpen) {
    return (
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(true)}
        title="Open Chat Assistant"
      >
        <Chat size="24px" color="#fff" />
        <span className="chatbot-badge">🤖</span>
      </button>
    );
  }

  return (
    <Box className="chatbot-container">
      {/* Header */}
      <Box className="chatbot-header">
        <Box direction="row" align="center" gap="small" flex>
          <span style={{ fontSize: '1.3rem' }}>🤖</span>
          <div style={{ display: 'flex', flexDirection: 'column'}}>
            <Text weight="bold" size="small">
              Your Cart Assistant
            </Text>
            <Text size="xsmall" color="#fff">
              Always here to help
            </Text>
          </div>
        </Box>
        <button
          className="chatbot-close"
          onClick={() => setIsOpen(false)}
          title="Close Chat"
        >
          ✕
        </button>
      </Box>

      {/* Messages */}
      <Box className="chatbot-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message message-${msg.sender}`}>
            {msg.sender === 'bot' && (
              <div className="message-avatar">🤖</div>
            )}
            <div className="message-bubble">
              <div
                className="message-text"
                style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}
              >
                {msg.text}
              </div>
            </div>
            {msg.sender === 'user' && (
              <div className="message-avatar">👤</div>
            )}

            {/* Quick Replies */}
            {msg.quickReplies && msg.sender === 'bot' && (
              <div className="quick-replies">
                {msg.quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    className="quick-reply-btn"
                    onClick={() => handleQuickReply(reply.action)}
                    disabled={isLoading}
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="message message-bot">
            <div className="message-avatar">🤖</div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box className="chatbot-input-area">
        <div className="chatbot-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chatbot-input"
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter' && !isLoading) {
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <button
            className="chatbot-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            title="Send message"
          >
            <Send size="18px" />
          </button>
        </div>
        <button
          className="chatbot-clear-btn"
          onClick={handleClearChat}
          title="Clear conversation"
        >
          🗑️ Clear
        </button>
      </Box>
    </Box>
  );
}
