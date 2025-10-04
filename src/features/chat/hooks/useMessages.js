/**
 * useMessages Hook
 * Custom React hook for managing messages in a conversation
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useMessages = (conversationId, messageService, currentUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pageSize = 50;

  /**
   * Load messages for the conversation
   */
  const loadMessages = useCallback(async (offset = 0, append = false) => {
    if (!messageService || !conversationId) return;

    try {
      setLoading(true);
      setError(null);

      const newMessages = await messageService.getMessages(conversationId, pageSize, offset);
      
      if (append) {
        setMessages(prev => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
      }

      setHasMore(newMessages && newMessages.length === pageSize);

      // Scroll to bottom if not appending (new conversation)
      if (!append && messagesEndRef.current) {
        setTimeout(() => {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }

    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, messageService, pageSize]);

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (hasMore && !loading && messages && messages.length > 0) {
      await loadMessages(messages.length, true);
    }
  }, [hasMore, loading, messages, loadMessages]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content, type = 'text', metadata = {}) => {
    if (!messageService || !conversationId || !currentUserId) return;

    try {
      setSending(true);
      setError(null);

      // Validate message
      const validation = messageService.validateMessage(content, type);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Send message
      const newMessage = await messageService.sendMessage(
        conversationId,
        currentUserId,
        content,
        type,
        metadata
      );

      // Add to local state
      const formattedMessage = messageService.formatMessage(newMessage, currentUserId);
      setMessages(prev => prev ? [...prev, formattedMessage] : [formattedMessage]);

      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
      throw err;
    } finally {
      setSending(false);
    }
  }, [conversationId, currentUserId, messageService]);

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(async () => {
    if (!messageService || !conversationId || !currentUserId) return;

    try {
      await messageService.markMessagesAsRead(conversationId, currentUserId);
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.senderId !== currentUserId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
      setError(err.message);
    }
  }, [conversationId, currentUserId, messageService]);

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(async (messageId) => {
    if (!messageService) return;

    try {
      setError(null);
      await messageService.deleteMessage(messageId);
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err.message);
      throw err;
    }
  }, [messageService]);

  /**
   * Retry failed message
   */
  const retryMessage = useCallback(async (messageId) => {
    if (!messageService) return;

    try {
      setError(null);
      const message = messages.find(msg => msg.id === messageId);
      if (!message) return;

      // Update status to sending
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'sending' } : msg
        )
      );

      // Retry sending
      await messageService.simulateMessageSend(message);
      
      // Update status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'sent' } : msg
        )
      );
    } catch (err) {
      console.error('Error retrying message:', err);
      setError(err.message);
      
      // Update status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  }, [messageService, messages]);

  /**
   * Handle typing indicator
   */
  const handleTyping = useCallback(() => {
    setTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1000);
  }, []);

  /**
   * Format messages for display
   */
  const formatMessages = useCallback((messages) => {
    if (!messageService || !currentUserId || !messages) return messages || [];
    
    return messages.map(msg => 
      messageService.formatMessage(msg, currentUserId)
    );
  }, [messageService, currentUserId]);

  /**
   * Get message status
   */
  const getMessageStatus = useCallback((message) => {
    if (!messageService) return '';
    return messageService.getStatusIcon(message.status);
  }, [messageService]);

  /**
   * Scroll to bottom
   */
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setHasMore(true);
  }, []);

  /**
   * Load messages when conversation changes
   */
  useEffect(() => {
    if (conversationId) {
      clearMessages();
      loadMessages();
    }
  }, [conversationId, loadMessages, clearMessages]);

  /**
   * Cleanup typing timeout
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (messages && messages.length > 0 && messagesEndRef.current) {
      const isNearBottom = messagesEndRef.current.getBoundingClientRect().top < window.innerHeight;
      if (isNearBottom) {
        setTimeout(() => {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [messages]);

  return {
    // State
    messages: formatMessages(messages),
    loading,
    error,
    sending,
    typing,
    hasMore,

    // Actions
    loadMessages,
    loadMoreMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    retryMessage,
    handleTyping,
    scrollToBottom,
    clearMessages,

    // Utils
    getMessageStatus,
    messagesEndRef
  };
};
