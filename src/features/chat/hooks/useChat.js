/**
 * useChat Hook
 * Custom React hook for managing chat conversations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatManager } from '../services/chatManager.js';
import { MessageService } from '../services/messageService.js';

export const useChat = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);

  const managerRef = useRef(null);
  const messageServiceRef = useRef(null);

  /**
   * Initialize chat services
   */
  const initializeChat = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!managerRef.current) {
        managerRef.current = new ChatManager();
        await managerRef.current.init();
        messageServiceRef.current = new MessageService(managerRef.current);
      }

      // Load conversations
      const userConversations = await managerRef.current.getConversations(userId);
      setConversations(userConversations);

      // Load settings
      const chatSettings = await managerRef.current.getChatSettings(userId);
      setSettings(chatSettings);

    } catch (err) {
      console.error('Error initializing chat:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(async (participants, type = 'direct') => {
    try {
      setError(null);
      const conversation = await managerRef.current.createConversation(participants, type);
      
      setConversations(prev => [conversation, ...prev]);
      return conversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get or create conversation with a user
   */
  const getOrCreateConversation = useCallback(async (otherUserId) => {
    try {
      // Check if conversation already exists
      const existingConversations = await managerRef.current.getConversations(userId);
      const existingConv = existingConversations.find(conv => 
        conv.participants.includes(otherUserId) && conv.type === 'direct'
      );

      if (existingConv) {
        return existingConv;
      }

      // Create new conversation
      return await createConversation([userId, otherUserId], 'direct');
    } catch (err) {
      console.error('Error getting or creating conversation:', err);
      setError(err.message);
      throw err;
    }
  }, [userId, createConversation]);

  /**
   * Select a conversation
   */
  const selectConversation = useCallback(async (conversationId) => {
    try {
      const conversation = await managerRef.current.getConversation(conversationId);
      setActiveConversation(conversation);
      return conversation;
    } catch (err) {
      console.error('Error selecting conversation:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Update conversation
   */
  const updateConversation = useCallback(async (conversationId, updates) => {
    try {
      setError(null);
      const updatedConversation = await managerRef.current.updateConversation(conversationId, updates);
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? updatedConversation : conv
        )
      );

      if (activeConversation && activeConversation.id === conversationId) {
        setActiveConversation(updatedConversation);
      }

      return updatedConversation;
    } catch (err) {
      console.error('Error updating conversation:', err);
      setError(err.message);
      throw err;
    }
  }, [activeConversation]);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      setError(null);
      await managerRef.current.deleteConversation(conversationId);
      
      setConversations(prev => 
        prev.filter(conv => conv.id !== conversationId)
      );

      if (activeConversation && activeConversation.id === conversationId) {
        setActiveConversation(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError(err.message);
      throw err;
    }
  }, [activeConversation]);

  /**
   * Update chat settings
   */
  const updateSettings = useCallback(async (newSettings) => {
    try {
      setError(null);
      const updatedSettings = await managerRef.current.updateChatSettings(userId, newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      console.error('Error updating chat settings:', err);
      setError(err.message);
      throw err;
    }
  }, [userId]);

  /**
   * Refresh conversations
   */
  const refreshConversations = useCallback(async () => {
    try {
      const userConversations = await managerRef.current.getConversations(userId);
      setConversations(userConversations);
    } catch (err) {
      console.error('Error refreshing conversations:', err);
      setError(err.message);
    }
  }, [userId]);

  /**
   * Clear all chat data
   */
  const clearAllData = useCallback(async () => {
    try {
      setError(null);
      await managerRef.current.clearAllData();
      setConversations([]);
      setActiveConversation(null);
      setSettings(null);
    } catch (err) {
      console.error('Error clearing chat data:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get conversation by ID
   */
  const getConversation = useCallback(async (conversationId) => {
    try {
      return await managerRef.current.getConversation(conversationId);
    } catch (err) {
      console.error('Error getting conversation:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Mark conversation as read
   */
  const markConversationAsRead = useCallback(async (conversationId) => {
    try {
      await updateConversation(conversationId, { unreadCount: 0 });
    } catch (err) {
      console.error('Error marking conversation as read:', err);
      setError(err.message);
    }
  }, [updateConversation]);

  /**
   * Get unread count
   */
  const getUnreadCount = useCallback(() => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  }, [conversations]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    if (userId) {
      initializeChat();
    }
  }, [userId, initializeChat]);

  /**
   * Handle online/offline status
   */
  useEffect(() => {
    const handleOnlineStatus = () => {
      if (messageServiceRef.current) {
        messageServiceRef.current.setOnlineStatus(navigator.onLine);
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return {
    // State
    conversations,
    activeConversation,
    loading,
    error,
    settings,

    // Actions
    createConversation,
    getOrCreateConversation,
    selectConversation,
    updateConversation,
    deleteConversation,
    updateSettings,
    refreshConversations,
    clearAllData,
    getConversation,
    markConversationAsRead,
    getUnreadCount,

    // Services
    chatManager: managerRef.current,
    messageService: messageServiceRef.current
  };
};
