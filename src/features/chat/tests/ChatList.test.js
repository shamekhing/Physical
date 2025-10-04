/**
 * ChatList Component Tests
 * Tests for the ChatList component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatList from '../components/ChatList.js';

describe('ChatList', () => {
  const mockConversations = [
    {
      id: 'conv1',
      participants: ['user1', 'user2'],
      type: 'direct',
      lastMessage: { content: 'Hello there', senderId: 'user2' },
      lastMessageAt: '2023-01-01T10:00:00Z',
      unreadCount: 2
    },
    {
      id: 'conv2',
      participants: ['user1', 'user3'],
      type: 'direct',
      lastMessage: { content: 'Hi', senderId: 'user1' },
      lastMessageAt: '2023-01-01T09:00:00Z',
      unreadCount: 0
    }
  ];

  const defaultProps = {
    conversations: mockConversations,
    activeConversation: null,
    onSelectConversation: jest.fn(),
    onDeleteConversation: jest.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render conversations list', () => {
      render(<ChatList {...defaultProps} />);

      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('2 conversations')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('user3')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<ChatList {...defaultProps} loading={true} />);

      expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const error = 'Failed to load conversations';
      render(<ChatList {...defaultProps} error={error} />);

      expect(screen.getByText(`Error loading conversations: ${error}`)).toBeInTheDocument();
    });

    it('should show empty state when no conversations', () => {
      render(<ChatList {...defaultProps} conversations={[]} />);

      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
      expect(screen.getByText('Start a conversation with someone!')).toBeInTheDocument();
    });
  });

  describe('conversation display', () => {
    it('should display conversation information correctly', () => {
      render(<ChatList {...defaultProps} />);

      // Check first conversation
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('Hello there')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // unread count

      // Check second conversation
      expect(screen.getByText('user3')).toBeInTheDocument();
      expect(screen.getByText('You: Hi')).toBeInTheDocument();
    });

    it('should show unread badge for conversations with unread messages', () => {
      render(<ChatList {...defaultProps} />);

      const unreadBadge = screen.getByText('2');
      expect(unreadBadge).toBeInTheDocument();
      expect(unreadBadge.closest('.unread-badge')).toBeInTheDocument();
    });

    it('should highlight active conversation', () => {
      const activeConversation = mockConversations[0];
      render(<ChatList {...defaultProps} activeConversation={activeConversation} />);

      const conversationItem = screen.getByText('user2').closest('.conversation-item');
      expect(conversationItem).toHaveClass('active');
    });

    it('should format last message correctly for own messages', () => {
      const conversations = [
        {
          id: 'conv1',
          participants: ['user1', 'user2'],
          type: 'direct',
          lastMessage: { content: 'Hello', senderId: 'user1' },
          lastMessageAt: '2023-01-01T10:00:00Z',
          unreadCount: 0
        }
      ];

      render(<ChatList {...defaultProps} conversations={conversations} />);

      expect(screen.getByText('You: Hello')).toBeInTheDocument();
    });

    it('should truncate long messages', () => {
      const conversations = [
        {
          id: 'conv1',
          participants: ['user1', 'user2'],
          type: 'direct',
          lastMessage: { 
            content: 'This is a very long message that should be truncated when displayed in the conversation list',
            senderId: 'user2'
          },
          lastMessageAt: '2023-01-01T10:00:00Z',
          unreadCount: 0
        }
      ];

      render(<ChatList {...defaultProps} conversations={conversations} />);

      expect(screen.getByText('This is a very long message th...')).toBeInTheDocument();
    });

    it('should show "No messages yet" when no last message', () => {
      const conversations = [
        {
          id: 'conv1',
          participants: ['user1', 'user2'],
          type: 'direct',
          lastMessage: null,
          lastMessageAt: '2023-01-01T10:00:00Z',
          unreadCount: 0
        }
      ];

      render(<ChatList {...defaultProps} conversations={conversations} />);

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onSelectConversation when conversation is clicked', () => {
      const mockOnSelectConversation = jest.fn();
      render(<ChatList {...defaultProps} onSelectConversation={mockOnSelectConversation} />);

      fireEvent.click(screen.getByText('user2'));

      expect(mockOnSelectConversation).toHaveBeenCalledWith('conv1');
    });

    it('should call onDeleteConversation when delete button is clicked', () => {
      const mockOnDeleteConversation = jest.fn();
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true);
      
      render(<ChatList {...defaultProps} onDeleteConversation={mockOnDeleteConversation} />);

      const deleteButton = screen.getAllByText('×')[0];
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this conversation?');
      expect(mockOnDeleteConversation).toHaveBeenCalledWith('conv1');
    });

    it('should not delete conversation if user cancels confirmation', () => {
      const mockOnDeleteConversation = jest.fn();
      
      // Mock window.confirm to return false
      window.confirm = jest.fn(() => false);
      
      render(<ChatList {...defaultProps} onDeleteConversation={mockOnDeleteConversation} />);

      const deleteButton = screen.getAllByText('×')[0];
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this conversation?');
      expect(mockOnDeleteConversation).not.toHaveBeenCalled();
    });

    it('should stop event propagation when delete button is clicked', () => {
      const mockOnSelectConversation = jest.fn();
      const mockOnDeleteConversation = jest.fn();
      
      window.confirm = jest.fn(() => true);
      
      render(
        <ChatList 
          {...defaultProps} 
          onSelectConversation={mockOnSelectConversation}
          onDeleteConversation={mockOnDeleteConversation}
        />
      );

      const deleteButton = screen.getAllByText('×')[0];
      fireEvent.click(deleteButton);

      expect(mockOnSelectConversation).not.toHaveBeenCalled();
      expect(mockOnDeleteConversation).toHaveBeenCalled();
    });
  });

  describe('conversation count', () => {
    it('should show singular form for one conversation', () => {
      const singleConversation = [mockConversations[0]];
      render(<ChatList {...defaultProps} conversations={singleConversation} />);

      expect(screen.getByText('1 conversation')).toBeInTheDocument();
    });

    it('should show plural form for multiple conversations', () => {
      render(<ChatList {...defaultProps} />);

      expect(screen.getByText('2 conversations')).toBeInTheDocument();
    });
  });

  describe('group conversations', () => {
    it('should display group conversation title', () => {
      const groupConversations = [
        {
          id: 'conv1',
          participants: ['user1', 'user2', 'user3'],
          type: 'group',
          title: 'Project Team',
          lastMessage: { content: 'Meeting at 3pm', senderId: 'user2' },
          lastMessageAt: '2023-01-01T10:00:00Z',
          unreadCount: 0
        }
      ];

      render(<ChatList {...defaultProps} conversations={groupConversations} />);

      expect(screen.getByText('Project Team')).toBeInTheDocument();
    });

    it('should display participant names for group without title', () => {
      const groupConversations = [
        {
          id: 'conv1',
          participants: ['user1', 'user2', 'user3'],
          type: 'group',
          lastMessage: { content: 'Meeting at 3pm', senderId: 'user2' },
          lastMessageAt: '2023-01-01T10:00:00Z',
          unreadCount: 0
        }
      ];

      render(<ChatList {...defaultProps} conversations={groupConversations} />);

      expect(screen.getByText('Group Chat')).toBeInTheDocument();
    });
  });
});
