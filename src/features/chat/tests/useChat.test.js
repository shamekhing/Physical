/**
 * useChat Hook Tests
 * Tests for the useChat custom hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '../hooks/useChat.js';

// Mock the services
jest.mock('../services/chatManager.js', () => ({
  ChatManager: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    createConversation: jest.fn(),
    getConversations: jest.fn(),
    getConversation: jest.fn(),
    updateConversation: jest.fn(),
    deleteConversation: jest.fn(),
    getChatSettings: jest.fn(),
    updateChatSettings: jest.fn(),
    clearAllData: jest.fn()
  }))
}));

jest.mock('../services/messageService.js', () => ({
  MessageService: jest.fn().mockImplementation(() => ({
    setOnlineStatus: jest.fn()
  }))
}));

describe('useChat', () => {
  const mockUserId = 'user1';
  let mockChatManager;
  let mockMessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockChatManager = {
      init: jest.fn().mockResolvedValue(),
      createConversation: jest.fn(),
      getConversations: jest.fn(),
      getConversation: jest.fn(),
      updateConversation: jest.fn(),
      deleteConversation: jest.fn(),
      getChatSettings: jest.fn(),
      updateChatSettings: jest.fn(),
      clearAllData: jest.fn()
    };

    mockMessageService = {
      setOnlineStatus: jest.fn()
    };

    // Mock the constructors
    const { ChatManager } = require('../services/chatManager.js');
    const { MessageService } = require('../services/messageService.js');
    
    ChatManager.mockImplementation(() => mockChatManager);
    MessageService.mockImplementation(() => mockMessageService);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChat(mockUserId));

      expect(result.current.conversations).toEqual([]);
      expect(result.current.activeConversation).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.settings).toBeNull();
    });

    it('should initialize chat services on mount', async () => {
      const mockConversations = [
        { id: 'conv1', participants: [mockUserId, 'user2'] }
      ];
      const mockSettings = { notifications: true };

      mockChatManager.getConversations.mockResolvedValue(mockConversations);
      mockChatManager.getChatSettings.mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockChatManager.init).toHaveBeenCalled();
      expect(mockChatManager.getConversations).toHaveBeenCalledWith(mockUserId);
      expect(mockChatManager.getChatSettings).toHaveBeenCalledWith(mockUserId);
      expect(result.current.conversations).toEqual(mockConversations);
      expect(result.current.settings).toEqual(mockSettings);
    });

    it('should handle initialization error', async () => {
      const error = new Error('Initialization failed');
      mockChatManager.init.mockRejectedValue(error);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.error).toBe('Initialization failed');
    });
  });

  describe('conversation management', () => {
    beforeEach(async () => {
      mockChatManager.getConversations.mockResolvedValue([]);
      mockChatManager.getChatSettings.mockResolvedValue({});
    });

    it('should create a conversation', async () => {
      const participants = [mockUserId, 'user2'];
      const mockConversation = { id: 'conv1', participants, type: 'direct' };
      
      mockChatManager.createConversation.mockResolvedValue(mockConversation);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      let createdConversation;
      await act(async () => {
        createdConversation = await result.current.createConversation(participants);
      });

      expect(mockChatManager.createConversation).toHaveBeenCalledWith(participants, 'direct');
      expect(createdConversation).toEqual(mockConversation);
      expect(result.current.conversations).toContain(mockConversation);
    });

    it('should get or create conversation with a user', async () => {
      const otherUserId = 'user2';
      const existingConversation = { id: 'conv1', participants: [mockUserId, otherUserId] };
      
      mockChatManager.getConversations.mockResolvedValue([existingConversation]);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      let conversation;
      await act(async () => {
        conversation = await result.current.getOrCreateConversation(otherUserId);
      });

      expect(conversation).toBeUndefined();
    });

    it('should create new conversation if none exists', async () => {
      const otherUserId = 'user2';
      const newConversation = { id: 'conv1', participants: [mockUserId, otherUserId] };
      
      mockChatManager.getConversations.mockResolvedValue([]);
      mockChatManager.createConversation.mockResolvedValue(newConversation);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      let conversation;
      await act(async () => {
        conversation = await result.current.getOrCreateConversation(otherUserId);
      });

      expect(mockChatManager.createConversation).toHaveBeenCalledWith([mockUserId, otherUserId], 'direct');
      expect(conversation).toEqual(newConversation);
    });

    it('should select a conversation', async () => {
      const conversationId = 'conv1';
      const mockConversation = { id: conversationId, participants: [mockUserId, 'user2'] };
      
      mockChatManager.getConversation.mockResolvedValue(mockConversation);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      let selectedConversation;
      await act(async () => {
        selectedConversation = await result.current.selectConversation(conversationId);
      });

      expect(mockChatManager.getConversation).toHaveBeenCalledWith(conversationId);
      expect(selectedConversation).toEqual(mockConversation);
      expect(result.current.activeConversation).toEqual(mockConversation);
    });

    it('should update a conversation', async () => {
      const conversationId = 'conv1';
      const updates = { unreadCount: 5 };
      const updatedConversation = { id: conversationId, ...updates };
      
      mockChatManager.updateConversation.mockResolvedValue(updatedConversation);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      let resultConversation;
      await act(async () => {
        resultConversation = await result.current.updateConversation(conversationId, updates);
      });

      expect(mockChatManager.updateConversation).toHaveBeenCalledWith(conversationId, updates);
      expect(resultConversation).toEqual(updatedConversation);
    });

    it('should delete a conversation', async () => {
      const conversationId = 'conv1';
      const mockConversations = [
        { id: 'conv1', participants: [mockUserId, 'user2'] },
        { id: 'conv2', participants: [mockUserId, 'user3'] }
      ];
      
      mockChatManager.getConversations.mockResolvedValue(mockConversations);
      mockChatManager.deleteConversation.mockResolvedValue();

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.deleteConversation(conversationId);
      });

      expect(mockChatManager.deleteConversation).toHaveBeenCalledWith(conversationId);
      expect(result.current.conversations).toHaveLength(1);
    });
  });

  describe('settings management', () => {
    beforeEach(async () => {
      mockChatManager.getConversations.mockResolvedValue([]);
      mockChatManager.getChatSettings.mockResolvedValue({});
    });

    it('should update chat settings', async () => {
      const newSettings = { notifications: false, soundEnabled: true };
      const updatedSettings = { id: mockUserId, ...newSettings };
      
      mockChatManager.updateChatSettings.mockResolvedValue(updatedSettings);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      let resultSettings;
      await act(async () => {
        resultSettings = await result.current.updateSettings(newSettings);
      });

      expect(mockChatManager.updateChatSettings).toHaveBeenCalledWith(mockUserId, newSettings);
      expect(resultSettings).toEqual(updatedSettings);
      expect(result.current.settings).toEqual(updatedSettings);
    });
  });

  describe('utility functions', () => {
    beforeEach(async () => {
      mockChatManager.getConversations.mockResolvedValue([]);
      mockChatManager.getChatSettings.mockResolvedValue({});
    });

    it('should refresh conversations', async () => {
      const mockConversations = [
        { id: 'conv1', participants: [mockUserId, 'user2'] }
      ];
      
      mockChatManager.getConversations.mockResolvedValue(mockConversations);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.refreshConversations();
      });

      expect(mockChatManager.getConversations).toHaveBeenCalledWith(mockUserId);
      expect(result.current.conversations).toEqual(mockConversations);
    });

    it('should clear all data', async () => {
      mockChatManager.clearAllData.mockResolvedValue();

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.clearAllData();
      });

      expect(mockChatManager.clearAllData).toHaveBeenCalled();
      expect(result.current.conversations).toEqual([]);
      expect(result.current.activeConversation).toBeNull();
      expect(result.current.settings).toBeNull();
    });

    it('should get unread count', async () => {
      const mockConversations = [
        { id: 'conv1', unreadCount: 3 },
        { id: 'conv2', unreadCount: 5 },
        { id: 'conv3', unreadCount: 0 }
      ];
      
      mockChatManager.getConversations.mockResolvedValue(mockConversations);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const unreadCount = result.current.getUnreadCount();
      expect(unreadCount).toBe(8);
    });

    it('should mark conversation as read', async () => {
      const conversationId = 'conv1';
      const updatedConversation = { id: conversationId, unreadCount: 0 };
      
      mockChatManager.updateConversation.mockResolvedValue(updatedConversation);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.markConversationAsRead(conversationId);
      });

      expect(mockChatManager.updateConversation).toHaveBeenCalledWith(conversationId, { unreadCount: 0 });
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      mockChatManager.getConversations.mockResolvedValue([]);
      mockChatManager.getChatSettings.mockResolvedValue({});
    });

    it('should handle conversation creation error', async () => {
      const error = new Error('Creation failed');
      mockChatManager.createConversation.mockRejectedValue(error);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        try {
          await result.current.createConversation(['user1', 'user2']);
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Creation failed');
      });
    });

    it('should handle conversation selection error', async () => {
      const error = new Error('Conversation not found');
      mockChatManager.getConversation.mockRejectedValue(error);

      const { result } = renderHook(() => useChat(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        try {
          await result.current.selectConversation('conv1');
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Conversation not found');
      });
    });
  });
});
