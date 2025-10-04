/**
 * MessageBubble Component
 * Individual message display component
 */

import React, { useState } from 'react';
import '../styles/MessageBubble.css';

const MessageBubble = ({ message, showAvatar, onDelete, onRetry }) => {
  const [showActions, setShowActions] = useState(false);

  const handleMouseEnter = () => {
    setShowActions(true);
  };

  const handleMouseLeave = () => {
    setShowActions(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete(message.id);
    }
  };

  const handleRetry = () => {
    onRetry(message.id);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      case 'failed': return '❌';
      case 'pending': return '⏸️';
      default: return '';
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'file': return '📎';
      case 'location': return '📍';
      case 'audio': return '🎵';
      case 'video': return '🎥';
      default: return '';
    }
  };

  return (
    <div
      className={`message-bubble ${message.isOwn ? 'own' : 'other'} ${showAvatar ? 'with-avatar' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showAvatar && !message.isOwn && (
        <div className="message-avatar">
          <div className="avatar-placeholder">
            {message.senderId ? message.senderId.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      )}
      
      <div className="message-content">
        {!message.isOwn && showAvatar && (
          <div className="message-sender">
            {message.senderId}
          </div>
        )}
        
        <div className="message-bubble-content">
          <div className="message-text">
            {getMessageTypeIcon(message.type)}
            {message.content}
          </div>
          
          <div className="message-meta">
            <span className="message-time">
              {formatTime(message.timestamp)}
            </span>
            
            {message.isOwn && (
              <span className="message-status">
                {getStatusIcon(message.status)}
              </span>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className="message-actions">
            {message.status === 'failed' && (
              <button
                className="action-button retry-button"
                onClick={handleRetry}
                title="Retry sending"
              >
                🔄
              </button>
            )}
            
            <button
              className="action-button delete-button"
              onClick={handleDelete}
              title="Delete message"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
