/**
 * MessageInput Component
 * Input field for sending messages
 */

import React, { useState, useRef, useEffect } from 'react';
import '../styles/MessageInput.css';

const MessageInput = ({ onSendMessage, sending, disabled }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    }
    
    // Clear typing indicator after delay
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage || sending || disabled) {
      return;
    }

    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Clear typing indicator
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEmojiClick = () => {
    // Simple emoji picker - in real app, use a proper emoji picker library
    const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setMessage(prev => prev + randomEmoji);
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleAttachmentClick = () => {
    // In real app, this would open file picker
    console.log('Attachment clicked');
  };

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="message-input">
      <div className="message-input-container">
        <button
          className="input-button attachment-button"
          onClick={handleAttachmentClick}
          disabled={disabled}
          title="Attach file"
        >
          📎
        </button>
        
        <div className="input-field-container">
          <textarea
            ref={textareaRef}
            className="message-textarea"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Select a conversation to start messaging" : "Type a message..."}
            disabled={disabled}
            maxLength={1000}
            rows={1}
          />
          
          <div className="input-footer">
            <span className="character-count">
              {message.length}/1000
            </span>
            {isTyping && (
              <span className="typing-indicator">
                Typing...
              </span>
            )}
          </div>
        </div>
        
        <button
          className="input-button emoji-button"
          onClick={handleEmojiClick}
          disabled={disabled}
          title="Add emoji"
        >
          😀
        </button>
        
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!message.trim() || sending || disabled}
          title="Send message"
        >
          {sending ? (
            <div className="sending-spinner"></div>
          ) : (
            '➤'
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
