/**
 * ChatWindow Component
 * Main chat interface with messages and input
 */

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.js';
import MessageInput from './MessageInput.js';
import '../styles/ChatWindow.css';

const ChatWindow = ({
  conversation,
  messages,
  loading,
  error,
  sending,
  onSendMessage,
  onDeleteMessage,
  onRetryMessage,
  onMarkAsRead,
  onLoadMore,
  hasMore,
  messagesEndRef
}) => {
  const messagesContainerRef = useRef(null);
  const isLoadingMoreRef = useRef(false);

  // Mark messages as read when conversation changes
  useEffect(() => {
    if (conversation && onMarkAsRead) {
      onMarkAsRead();
    }
  }, [conversation, onMarkAsRead]);

  // Handle scroll to load more messages
  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    
    if (scrollTop === 0 && hasMore && !loading && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      onLoadMore().finally(() => {
        isLoadingMoreRef.current = false;
      });
    }
  };

  const getConversationTitle = () => {
    if (!conversation) return 'Select a conversation';
    
    if (conversation.type === 'direct') {
      return conversation.participants
        .filter(p => p !== 'current-user' && p !== 'user1')
        .join(', ');
    }
    
    return conversation.title || 'Group Chat';
  };

  const getConversationSubtitle = () => {
    if (!conversation) return '';
    
    if (conversation.type === 'direct') {
      return 'Direct message';
    }
    
    return `${conversation.participants.length} participants`;
  };

  if (!conversation) {
    return (
      <div className="chat-window">
        <div className="chat-window-empty">
          <div className="empty-state">
            <h3>Welcome to Chat</h3>
            <p>Select a conversation to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="conversation-info">
          <div className="conversation-avatar">
            <div className="avatar-placeholder">
              {conversation.participants
                .filter(p => p !== 'current-user' && p !== 'user1')
                .map(p => p.charAt(0).toUpperCase())
                .join('')
                .substring(0, 2)}
            </div>
          </div>
          <div className="conversation-details">
            <h3 className="conversation-title">{getConversationTitle()}</h3>
            <p className="conversation-subtitle">{getConversationSubtitle()}</p>
          </div>
        </div>
        
        <div className="chat-window-actions">
          <button className="action-button" title="Conversation info">
            ℹ️
          </button>
        </div>
      </div>

      <div className="chat-window-content">
        {error && (
          <div className="chat-error">
            <p>Error: {error}</p>
          </div>
        )}

        <div 
          className="messages-container"
          ref={messagesContainerRef}
          onScroll={handleScroll}
          data-testid="messages-container"
        >
          {loading && messages.length === 0 ? (
            <div className="messages-loading">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : (
            <>
              {hasMore && (
                <div className="load-more-container">
                  <button 
                    className="load-more-button"
                    onClick={onLoadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load more messages'}
                  </button>
                </div>
              )}
              
              <div className="messages-list">
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];
                  const showAvatar = !prevMessage || 
                    prevMessage.senderId !== message.senderId ||
                    new Date(message.timestamp) - new Date(prevMessage.timestamp) > 300000; // 5 minutes

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      showAvatar={showAvatar}
                      onDelete={onDeleteMessage}
                      onRetry={onRetryMessage}
                    />
                  );
                })}
                
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>

        <div className="chat-window-input">
          <MessageInput
            onSendMessage={onSendMessage}
            sending={sending}
            disabled={!conversation}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
