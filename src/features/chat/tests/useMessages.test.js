/**
 * useMessages Hook Tests
 * Tests for the useMessages custom hook
 */

import { renderHook, act } from '@testing-library/react';
import { useMessages } from '../hooks/useMessages.js';

describe('useMessages', () => {
  const mockConversationId = 'conv1';
  const mockCurrentUserId = 'user1';
  let mockMessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMessageService = {
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
      markMessagesAsRead: jest.fn(),
      deleteMessage: jest.fn(),
      simulateMessageSend: jest.fn(),
      validateMessage: jest.fn(),
      formatMessage: jest.fn(),
      getStatusIcon: jest.fn()
    };
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      expect(result.current.messages).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.sending).toBe(false);
      expect(result.current.typing).toBe(false);
      expect(result.current.hasMore).toBe(true);
    });

    it('should load messages on mount', async () => {
      const mockMessages = [
        { id: 'msg1', content: 'Hello', senderId: 'user1' },
        { id: 'msg2', content: 'Hi', senderId: 'user2' }
      ];
      
      mockMessageService.getMessages.mockResolvedValue(mockMessages);
      mockMessageService.formatMessage.mockImplementation((msg) => ({ ...msg, formatted: true }));

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockMessageService.getMessages).toHaveBeenCalledWith(mockConversationId, 50, 0);
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0]).toEqual(expect.objectContaining({ formatted: true }));
    });
  });

  describe('message loading', () => {
    beforeEach(() => {
      mockMessageService.formatMessage.mockImplementation((msg) => msg);
    });

    it('should load more messages', async () => {
      const initialMessages = Array(50).fill().map((_, i) => ({ id: `msg${i}`, content: `Message ${i}` }));
      const moreMessages = Array(30).fill().map((_, i) => ({ id: `msg${i + 50}`, content: `Message ${i + 50}` }));
      
      mockMessageService.getMessages
        .mockResolvedValueOnce(initialMessages)
        .mockResolvedValueOnce(moreMessages);

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.loadMoreMessages();
      });

      expect(mockMessageService.getMessages).toHaveBeenCalledWith(mockConversationId, 50, 50);
      expect(result.current.messages).toHaveLength(80);
    });

    it('should not load more if no more messages', async () => {
      const messages = Array(30).fill().map((_, i) => ({ id: `msg${i}`, content: `Message ${i}` }));
      
      mockMessageService.getMessages.mockResolvedValue(messages);

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.hasMore).toBe(false);
      
      await act(async () => {
        await result.current.loadMoreMessages();
      });

      expect(mockMessageService.getMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('message sending', () => {
    beforeEach(() => {
      mockMessageService.formatMessage.mockImplementation((msg) => msg);
    });

    it('should send a message successfully', async () => {
      const messageContent = 'Hello world';
      const mockMessage = {
        id: 'msg1',
        content: messageContent,
        senderId: mockCurrentUserId,
        timestamp: new Date().toISOString()
      };
      
      mockMessageService.validateMessage.mockReturnValue({ isValid: true, errors: [] });
      mockMessageService.sendMessage.mockResolvedValue(mockMessage);

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      let sentMessage;
      await act(async () => {
        sentMessage = await result.current.sendMessage(messageContent);
      });

      expect(mockMessageService.validateMessage).toHaveBeenCalledWith(messageContent, 'text');
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(
        mockConversationId,
        mockCurrentUserId,
        messageContent,
        'text',
        {}
      );
      expect(sentMessage).toEqual(mockMessage);
      expect(result.current.messages).toContain(mockMessage);
    });

    it('should handle message validation error', async () => {
      const messageContent = '';
      
      mockMessageService.validateMessage.mockReturnValue({
        isValid: false,
        errors: ['Message content cannot be empty']
      });

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        try {
          await result.current.sendMessage(messageContent);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Message content cannot be empty');
    });

    it('should handle send message error', async () => {
      const messageContent = 'Hello world';
      const error = new Error('Send failed');
      
      mockMessageService.validateMessage.mockReturnValue({ isValid: true, errors: [] });
      mockMessageService.sendMessage.mockRejectedValue(error);

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        try {
          await result.current.sendMessage(messageContent);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Send failed');
    });
  });

  describe('message operations', () => {
    beforeEach(() => {
      mockMessageService.formatMessage.mockImplementation((msg) => msg);
    });

    it('should mark messages as read', async () => {
      const mockMessages = [
        { id: 'msg1', senderId: 'user2', isRead: false },
        { id: 'msg2', senderId: 'user1', isRead: false }
      ];
      
      mockMessageService.getMessages.mockResolvedValue(mockMessages);
      mockMessageService.markMessagesAsRead.mockResolvedValue(1);

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.markAsRead();
      });

      expect(mockMessageService.markMessagesAsRead).toHaveBeenCalledWith(mockConversationId, mockCurrentUserId);
    });

    it('should delete a message', async () => {
      const messageId = 'msg1';
      const mockMessages = [{ id: messageId, content: 'Hello' }];
      
      mockMessageService.getMessages.mockResolvedValue(mockMessages);
      mockMessageService.deleteMessage.mockResolvedValue();

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.deleteMessage(messageId);
      });

      expect(mockMessageService.deleteMessage).toHaveBeenCalledWith(messageId);
      expect(result.current.messages).toHaveLength(0);
    });

    it('should retry a failed message', async () => {
      const messageId = 'msg1';
      const mockMessages = [{ id: messageId, content: 'Hello', status: 'failed' }];
      
      mockMessageService.getMessages.mockResolvedValue(mockMessages);
      mockMessageService.simulateMessageSend.mockResolvedValue();

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.retryMessage(messageId);
      });

      expect(mockMessageService.simulateMessageSend).toHaveBeenCalledWith(mockMessages[0]);
    });
  });

  describe('typing indicator', () => {
    it('should handle typing', async () => {
      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      act(() => {
        result.current.handleTyping();
      });

      expect(result.current.typing).toBe(true);

      // Wait for timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      expect(result.current.typing).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should get message status', () => {
      mockMessageService.getStatusIcon.mockReturnValue('✓');
      
      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      const status = result.current.getMessageStatus({ status: 'sent' });
      expect(status).toBe('✓');
      expect(mockMessageService.getStatusIcon).toHaveBeenCalledWith('sent');
    });

    it('should clear messages', async () => {
      const mockMessages = [{ id: 'msg1', content: 'Hello' }];
      
      mockMessageService.getMessages.mockResolvedValue(mockMessages);
      mockMessageService.formatMessage.mockImplementation((msg) => msg);

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('conversation changes', () => {
    it('should clear messages when conversation changes', async () => {
      const { result, rerender } = renderHook(
        ({ conversationId }) => useMessages(conversationId, mockMessageService, mockCurrentUserId),
        { initialProps: { conversationId: 'conv1' } }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Change conversation
      rerender({ conversationId: 'conv2' });

      expect(result.current.messages).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle load messages error', async () => {
      const error = new Error('Load failed');
      mockMessageService.getMessages.mockRejectedValue(error);

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.error).toBe('Load failed');
    });

    it('should handle delete message error', async () => {
      const error = new Error('Delete failed');
      mockMessageService.deleteMessage.mockRejectedValue(error);

      const { result } = renderHook(() => 
        useMessages(mockConversationId, mockMessageService, mockCurrentUserId)
      );

      await act(async () => {
        try {
          await result.current.deleteMessage('msg1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Delete failed');
    });
  });
});
