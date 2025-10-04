/**
 * MessageService Tests
 * Tests for the MessageService
 */

import { MessageService } from '../services/messageService.js';

// Mock ChatManager
const mockChatManager = {
  generateId: jest.fn(() => 'msg123'),
  db: {
    transaction: jest.fn(() => ({
      objectStore: jest.fn(() => ({
        add: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        index: jest.fn(() => ({
          getAll: jest.fn()
        }))
      }))
    }))
  }
};

describe('MessageService', () => {
  let messageService;

  beforeEach(() => {
    messageService = new MessageService(mockChatManager);
    jest.clearAllMocks();
  });

  describe('message sending', () => {
    it('should send a message successfully', async () => {
      const conversationId = 'conv1';
      const senderId = 'user1';
      const content = 'Hello world';
      
      const mockMessage = {
        id: 'msg123',
        conversationId,
        senderId,
        content,
        type: 'text',
        timestamp: expect.any(String),
        status: 'sent',
        isRead: false
      };

      // Mock storeMessage
      const mockStore = {
        add: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockChatManager.db.transaction.mockReturnValue(mockTransaction);

      const mockAddRequest = {
        onsuccess: null,
        onerror: null
      };
      mockStore.add.mockReturnValue(mockAddRequest);

      // Mock simulateMessageSend
      jest.spyOn(messageService, 'simulateMessageSend').mockResolvedValue(mockMessage);

      // Mock updateConversationLastMessage
      jest.spyOn(messageService, 'updateConversationLastMessage').mockResolvedValue();

      // Mock updateMessage
      jest.spyOn(messageService, 'updateMessage').mockResolvedValue(mockMessage);

      // Mock storeMessage
      jest.spyOn(messageService, 'storeMessage').mockResolvedValue(mockMessage);

      const result = await messageService.sendMessage(conversationId, senderId, content);

      expect(result).toEqual(expect.objectContaining({
        conversationId,
        senderId,
        content,
        type: 'text'
      }));
      expect(messageService.simulateMessageSend).toHaveBeenCalledWith(expect.objectContaining({
        conversationId,
        senderId,
        content
      }));
    });

    it('should handle message send failure', async () => {
      const conversationId = 'conv1';
      const senderId = 'user1';
      const content = 'Hello world';

      // Mock storeMessage
      const mockStore = {
        add: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockChatManager.db.transaction.mockReturnValue(mockTransaction);

      const mockAddRequest = {
        onsuccess: null,
        onerror: null
      };
      mockStore.add.mockReturnValue(mockAddRequest);

      // Mock simulateMessageSend to fail
      jest.spyOn(messageService, 'simulateMessageSend').mockRejectedValue(new Error('Network error'));

      // Mock updateMessage
      jest.spyOn(messageService, 'updateMessage').mockResolvedValue();

      // Mock storeMessage
      jest.spyOn(messageService, 'storeMessage').mockResolvedValue();

      // Mock getConversation and updateConversation
      mockChatManager.getConversation = jest.fn().mockResolvedValue({ id: 'conv1' });
      mockChatManager.updateConversation = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(messageService.sendMessage(conversationId, senderId, content))
        .rejects.toThrow('Network error');
    });
  });

  describe('message retrieval', () => {
    it('should get messages for a conversation', async () => {
      const conversationId = 'conv1';
      const mockMessages = [
        { id: 'msg1', conversationId, content: 'Hello', timestamp: '2023-01-01T10:00:00Z' },
        { id: 'msg2', conversationId, content: 'Hi', timestamp: '2023-01-01T10:01:00Z' }
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
      mockChatManager.db.transaction.mockReturnValue(mockTransaction);

      const mockGetRequest = {
        onsuccess: null,
        onerror: null,
        result: mockMessages
      };
      mockIndex.getAll.mockReturnValue(mockGetRequest);

      const promise = messageService.getMessages(conversationId);
      mockGetRequest.onsuccess();

      const result = await promise;

      expect(mockIndex.getAll).toHaveBeenCalledWith(conversationId);
      expect(result).toEqual(mockMessages);
    });

    it('should get messages with limit and offset', async () => {
      const conversationId = 'conv1';
      const limit = 10;
      const offset = 5;
      const mockMessages = Array(10).fill().map((_, i) => ({
        id: `msg${i}`,
        conversationId,
        content: `Message ${i}`,
        timestamp: `2023-01-01T10:0${i}:00Z`
      }));

      const mockIndex = {
        getAll: jest.fn()
      };
      const mockStore = {
        index: jest.fn(() => mockIndex)
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockChatManager.db.transaction.mockReturnValue(mockTransaction);

      const mockGetRequest = {
        onsuccess: null,
        onerror: null,
        result: mockMessages
      };
      mockIndex.getAll.mockReturnValue(mockGetRequest);

      const promise = messageService.getMessages(conversationId, limit, offset);
      mockGetRequest.onsuccess();

      const result = await promise;

      expect(mockIndex.getAll).toHaveBeenCalledWith(conversationId);
      expect(result).toEqual(mockMessages.slice(5, 10)); // Messages from offset 5 with limit 10
    });
  });

  describe('message operations', () => {
    it('should mark messages as read', async () => {
      const conversationId = 'conv1';
      const userId = 'user1';
      const mockMessages = [
        { id: 'msg1', conversationId, senderId: 'user2', isRead: false },
        { id: 'msg2', conversationId, senderId: 'user1', isRead: false },
        { id: 'msg3', conversationId, senderId: 'user2', isRead: false }
      ];

      const mockIndex = {
        getAll: jest.fn()
      };
      const mockStore = {
        index: jest.fn(() => mockIndex),
        put: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockChatManager.db.transaction.mockReturnValue(mockTransaction);

      const mockGetRequest = {
        onsuccess: null,
        onerror: null,
        result: mockMessages
      };
      mockIndex.getAll.mockReturnValue(mockGetRequest);

      const promise = messageService.markMessagesAsRead(conversationId, userId);
      mockGetRequest.onsuccess();

      const result = await promise;

      expect(result).toBe(2); // Only messages from other users
      expect(mockStore.put).toHaveBeenCalledTimes(2);
    });

    it('should delete a message', async () => {
      const messageId = 'msg1';

      const mockStore = {
        delete: jest.fn()
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore)
      };
      mockChatManager.db.transaction.mockReturnValue(mockTransaction);

      const mockDeleteRequest = {
        onsuccess: null,
        onerror: null
      };
      mockStore.delete.mockReturnValue(mockDeleteRequest);

      const promise = messageService.deleteMessage(messageId);
      mockDeleteRequest.onsuccess();

      await promise;

      expect(mockStore.delete).toHaveBeenCalledWith(messageId);
    });
  });

  describe('message validation', () => {
    it('should validate message content', () => {
      const validContent = 'Hello world';
      const result = messageService.validateMessage(validContent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty messages', () => {
      const emptyContent = '';
      const result = messageService.validateMessage(emptyContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content cannot be empty');
    });

    it('should reject messages that are too long', () => {
      const longContent = 'a'.repeat(1001);
      const result = messageService.validateMessage(longContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content cannot exceed 1000 characters');
    });

    it('should reject messages with script tags', () => {
      const maliciousContent = 'Hello <script>alert("xss")</script>';
      const result = messageService.validateMessage(maliciousContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content contains invalid characters');
    });
  });

  describe('message formatting', () => {
    it('should format message for display', () => {
      const message = {
        id: 'msg1',
        senderId: 'user1',
        content: 'Hello',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      const currentUserId = 'user1';

      const result = messageService.formatMessage(message, currentUserId);

      expect(result).toEqual(expect.objectContaining({
        ...message,
        isOwn: true,
        displayTime: expect.any(String),
        statusIcon: '✓'
      }));
    });

    it('should format timestamp correctly', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now - 60000);
      const oneHourAgo = new Date(now - 3600000);
      const oneDayAgo = new Date(now - 86400000);

      expect(messageService.formatTimestamp(now.toISOString())).toBe('Just now');
      expect(messageService.formatTimestamp(oneMinuteAgo.toISOString())).toMatch(/\d+m ago/);
      expect(messageService.formatTimestamp(oneHourAgo.toISOString())).toMatch(/\d+h ago/);
      expect(messageService.formatTimestamp(oneDayAgo.toISOString())).toMatch(/\d+\/\d+\/\d+/);
    });

    it('should get correct status icon', () => {
      expect(messageService.getStatusIcon('sending')).toBe('⏳');
      expect(messageService.getStatusIcon('sent')).toBe('✓');
      expect(messageService.getStatusIcon('delivered')).toBe('✓✓');
      expect(messageService.getStatusIcon('read')).toBe('✓✓');
      expect(messageService.getStatusIcon('failed')).toBe('❌');
      expect(messageService.getStatusIcon('pending')).toBe('⏸️');
      expect(messageService.getStatusIcon('unknown')).toBe('');
    });
  });

  describe('retry functionality', () => {
    it('should retry failed messages', async () => {
      const failedMessages = [
        { id: 'msg1', status: 'failed', retryCount: 0 },
        { id: 'msg2', status: 'pending', retryCount: 0 }
      ];

      jest.spyOn(messageService, 'getFailedMessages').mockResolvedValue(failedMessages);
      jest.spyOn(messageService, 'simulateMessageSend').mockResolvedValue();
      jest.spyOn(messageService, 'updateMessage').mockResolvedValue();

      await messageService.retryFailedMessages();

      expect(messageService.simulateMessageSend).toHaveBeenCalledTimes(2);
      expect(messageService.updateMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle retry failures', async () => {
      const failedMessage = { id: 'msg1', status: 'failed', retryCount: 0 };

      jest.spyOn(messageService, 'getFailedMessages').mockResolvedValue([failedMessage]);
      jest.spyOn(messageService, 'simulateMessageSend').mockRejectedValue(new Error('Network error'));
      jest.spyOn(messageService, 'updateMessage').mockResolvedValue();

      await messageService.retryFailedMessages();

      expect(messageService.updateMessage).toHaveBeenCalledWith(expect.objectContaining({
        retryCount: 1
      }));
    });
  });

  describe('online status', () => {
    it('should set online status', () => {
      messageService.setOnlineStatus(true);
      expect(messageService.isOnline).toBe(true);

      messageService.setOnlineStatus(false);
      expect(messageService.isOnline).toBe(false);
    });

    it('should process message queue when coming online', async () => {
      const queuedMessage = { id: 'msg1', status: 'pending' };
      messageService.messageQueue = [queuedMessage];

      jest.spyOn(messageService, 'simulateMessageSend').mockResolvedValue();
      jest.spyOn(messageService, 'updateMessage').mockResolvedValue();

      messageService.setOnlineStatus(true);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messageService.simulateMessageSend).toHaveBeenCalledWith(queuedMessage);
      expect(messageService.messageQueue).toHaveLength(0);
    });
  });
});
