/**
 * ChatManager Tests
 * Tests for the ChatManager service
 */

import { ChatManager } from '../services/chatManager.js';

// Mock IndexedDB
    const mockObjectStore = {
      createIndex: jest.fn()
    };
    
    const mockDB = {
      objectStoreNames: {
        contains: jest.fn(() => false)
      },
      createObjectStore: jest.fn(() => mockObjectStore),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(),
          get: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          index: jest.fn(() => ({
            getAll: jest.fn()
          }))
        }))
      }))
    };

// Create a mock request that allows setting event handlers
const createMockRequest = () => {
  const request = {
    result: mockDB,
    error: null
  };
  
  // Make event handlers settable
  Object.defineProperty(request, 'onerror', {
    writable: true,
    value: null
  });
  
  Object.defineProperty(request, 'onsuccess', {
    writable: true,
    value: null
  });
  
  Object.defineProperty(request, 'onupgradeneeded', {
    writable: true,
    value: null
  });
  
  return request;
};

global.indexedDB = {
  open: jest.fn(() => createMockRequest())
};

describe('ChatManager', () => {
  let chatManager;

  beforeEach(() => {
    chatManager = new ChatManager();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const mockRequest = createMockRequest();
      indexedDB.open.mockReturnValue(mockRequest);
      
      const initPromise = chatManager.init();
      
      mockRequest.onsuccess();
      
      await initPromise;
      
      expect(indexedDB.open).toHaveBeenCalledWith('PhysicalChatDB', 1);
      expect(chatManager.db).toBe(mockDB);
    });

    it('should handle initialization error', async () => {
      const error = new Error('DB Error');
      const mockRequest = createMockRequest();
      mockRequest.error = error;
      indexedDB.open.mockReturnValue(mockRequest);
      
      const initPromise = chatManager.init();
      
      mockRequest.onerror();
      
      await expect(initPromise).rejects.toThrow('DB Error');
    });

    it('should create object stores on upgrade', async () => {
      const mockEvent = {
        target: { result: mockDB }
      };
      const mockRequest = createMockRequest();
      indexedDB.open.mockReturnValue(mockRequest);
      
      const initPromise = chatManager.init();
      
      // Mock the onupgradeneeded handler properly
      const upgradeHandler = mockRequest.onupgradeneeded;
      if (upgradeHandler) {
        // Ensure the mock object store has the createIndex method
        mockObjectStore.createIndex.mockReturnValue(mockObjectStore);
        upgradeHandler(mockEvent);
      }
      
      await initPromise;
      
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('conversations', { keyPath: 'id' });
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('messages', { keyPath: 'id' });
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('chatSettings', { keyPath: 'id' });
    });
  });

  describe('conversation management', () => {
    beforeEach(async () => {
      chatManager.db = mockDB;
    });

    it('should create a conversation', async () => {
      const participants = ['user1', 'user2'];
      const mockConversation = {
        id: 'conv1',
        participants,
        type: 'direct',
        createdAt: expect.any(String),
        lastMessageAt: expect.any(String),
        lastMessage: null,
        unreadCount: 0,
        isActive: true
      };

      const mockStore = {
        add: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const mockAddRequest = {
        onsuccess: null,
        onerror: null
      };
      mockStore.add.mockReturnValue(mockAddRequest);

      const promise = chatManager.createConversation(participants);
      mockAddRequest.onsuccess();

      const result = await promise;

      expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({
        participants,
        type: 'direct',
        isActive: true
      }));
      expect(result).toEqual(expect.objectContaining({
        participants,
        type: 'direct'
      }));
    });

    it('should get conversations for a user', async () => {
      const userId = 'user1';
      const mockConversations = [
        { id: 'conv1', participants: [userId, 'user2'], isActive: true, lastMessageAt: '2023-01-02' },
        { id: 'conv2', participants: [userId, 'user3'], isActive: true, lastMessageAt: '2023-01-01' }
      ];

      const mockIndex = {
        getAll: jest.fn()
      };
      const mockStore = {
        index: jest.fn(() => mockIndex)
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const mockGetRequest = {
        onsuccess: null,
        onerror: null,
        result: mockConversations
      };
      mockIndex.getAll.mockReturnValue(mockGetRequest);

      const promise = chatManager.getConversations(userId);
      mockGetRequest.onsuccess();

      const result = await promise;

      expect(mockIndex.getAll).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockConversations);
    });

    it('should get a specific conversation', async () => {
      const conversationId = 'conv1';
      const mockConversation = { id: conversationId, participants: ['user1', 'user2'] };

      const mockStore = {
        get: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const mockGetRequest = {
        onsuccess: null,
        onerror: null,
        result: mockConversation
      };
      mockStore.get.mockReturnValue(mockGetRequest);

      const promise = chatManager.getConversation(conversationId);
      mockGetRequest.onsuccess();

      const result = await promise;

      expect(mockStore.get).toHaveBeenCalledWith(conversationId);
      expect(result).toBe(mockConversation);
    });

    it('should update a conversation', async () => {
      const conversationId = 'conv1';
      const updates = { unreadCount: 5 };
      const existingConversation = { id: conversationId, participants: ['user1', 'user2'] };
      const updatedConversation = { ...existingConversation, ...updates };

      const mockStore = {
        get: jest.fn(),
        put: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const mockGetRequest = {
        onsuccess: null,
        onerror: null,
        result: existingConversation
      };
      const mockPutRequest = {
        onsuccess: null,
        onerror: null
      };

      mockStore.get.mockReturnValue(mockGetRequest);
      mockStore.put.mockReturnValue(mockPutRequest);

      const promise = chatManager.updateConversation(conversationId, updates);
      mockGetRequest.onsuccess();
      mockPutRequest.onsuccess();

      const result = await promise;

      expect(mockStore.get).toHaveBeenCalledWith(conversationId);
      expect(mockStore.put).toHaveBeenCalledWith(updatedConversation);
      expect(result).toEqual(updatedConversation);
    });

    it('should delete a conversation', async () => {
      const conversationId = 'conv1';

      const mockConversationsStore = {
        delete: jest.fn()
      };
      const mockMessagesStore = {
        index: jest.fn(() => ({
          getAll: jest.fn()
        })),
        delete: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn((storeName) => {
          if (storeName === 'conversations') return mockConversationsStore;
          if (storeName === 'messages') return mockMessagesStore;
        }),
        oncomplete: null,
        onerror: null
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const mockDeleteRequest = {
        onsuccess: null,
        onerror: null
      };
      mockConversationsStore.delete.mockReturnValue(mockDeleteRequest);

      const promise = chatManager.deleteConversation(conversationId);
      mockDeleteRequest.onsuccess();
      if (mockTransaction.oncomplete) mockTransaction.oncomplete();

      await promise;

      expect(mockConversationsStore.delete).toHaveBeenCalledWith(conversationId);
    });
  });

  describe('settings management', () => {
    beforeEach(async () => {
      chatManager.db = mockDB;
    });

    it('should get chat settings', async () => {
      const userId = 'user1';
      const mockSettings = { id: userId, notifications: true };

      const mockStore = {
        get: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const mockGetRequest = {
        onsuccess: null,
        onerror: null,
        result: mockSettings
      };
      mockStore.get.mockReturnValue(mockGetRequest);

      const promise = chatManager.getChatSettings(userId);
      mockGetRequest.onsuccess();

      const result = await promise;

      expect(result).toBe(mockSettings);
    });

    it('should return default settings if none exist', async () => {
      const userId = 'user1';

      const mockStore = {
        get: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const mockGetRequest = {
        onsuccess: null,
        onerror: null,
        result: undefined
      };
      mockStore.get.mockReturnValue(mockGetRequest);

      const promise = chatManager.getChatSettings(userId);
      mockGetRequest.onsuccess();

      const result = await promise;

      expect(result).toEqual({
        id: userId,
        notifications: true,
        soundEnabled: true,
        typingIndicators: true,
        readReceipts: true,
        theme: 'light'
      });
    });

    it('should update chat settings', async () => {
      const userId = 'user1';
      const settings = { notifications: false };

      const mockStore = {
        put: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const mockPutRequest = {
        onsuccess: null,
        onerror: null,
        result: { id: userId, ...settings }
      };
      mockStore.put.mockReturnValue(mockPutRequest);

      const promise = chatManager.updateChatSettings(userId, settings);
      mockPutRequest.onsuccess();

      const result = await promise;

      expect(mockStore.put).toHaveBeenCalledWith({ id: userId, ...settings });
      expect(result).toEqual({ id: userId, ...settings });
    });
  });

  describe('utility methods', () => {
    it('should generate unique IDs', () => {
      const id1 = chatManager.generateId();
      const id2 = chatManager.generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should check IndexedDB availability', () => {
      expect(chatManager.isAvailable()).toBe(true);
    });

    it('should clear all data', async () => {
      chatManager.db = mockDB;

      const mockStore = {
        clear: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
        oncomplete: null,
        onerror: null
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const promise = chatManager.clearAllData();
      if (mockTransaction.oncomplete) mockTransaction.oncomplete();

      await promise;

      expect(mockStore.clear).toHaveBeenCalledTimes(3); // conversations, messages, chatSettings
    });
  });
});
