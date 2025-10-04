/**
 * ChatWindow Component Tests
 * Tests for the ChatWindow component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatWindow from '../components/ChatWindow.js';

// Mock the child components
jest.mock('../components/MessageBubble.js', () => {
  return function MockMessageBubble({ message }) {
    return <div data-testid={`message-${message.id}`}>{message.content}</div>;
  };
});

jest.mock('../components/MessageInput.js', () => {
  return function MockMessageInput({ onSendMessage, sending, disabled }) {
    return (
      <div data-testid="message-input">
        <button 
          onClick={() => onSendMessage('Test message')}
          disabled={disabled || sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    );
  };
});

describe('ChatWindow', () => {
  const mockConversation = {
    id: 'conv1',
    participants: ['user1', 'user2'],
    type: 'direct',
    lastMessageAt: '2023-01-01T10:00:00Z'
  };

  const mockMessages = [
    {
      id: 'msg1',
      content: 'Hello',
      senderId: 'user1',
      timestamp: '2023-01-01T10:00:00Z',
      isOwn: true
    },
    {
      id: 'msg2',
      content: 'Hi there',
      senderId: 'user2',
      timestamp: '2023-01-01T10:01:00Z',
      isOwn: false
    }
  ];

  const defaultProps = {
    conversation: mockConversation,
    messages: mockMessages,
    loading: false,
    error: null,
    sending: false,
    onSendMessage: jest.fn(),
    onDeleteMessage: jest.fn(),
    onRetryMessage: jest.fn(),
    onMarkAsRead: jest.fn(),
    onLoadMore: jest.fn(),
    hasMore: true,
    messagesEndRef: { current: null }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render empty state when no conversation', () => {
      render(<ChatWindow {...defaultProps} conversation={null} />);

      expect(screen.getByText('Welcome to Chat')).toBeInTheDocument();
      expect(screen.getByText('Select a conversation to start messaging')).toBeInTheDocument();
    });

    it('should render conversation header', () => {
      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('Direct message')).toBeInTheDocument();
    });

    it('should render group conversation header', () => {
      const groupConversation = {
        ...mockConversation,
        type: 'group',
        title: 'Project Team',
        participants: ['user1', 'user2', 'user3']
      };

      render(<ChatWindow {...defaultProps} conversation={groupConversation} />);

      expect(screen.getByText('Project Team')).toBeInTheDocument();
      expect(screen.getByText('3 participants')).toBeInTheDocument();
    });

    it('should render messages', () => {
      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByTestId('message-msg1')).toBeInTheDocument();
      expect(screen.getByTestId('message-msg2')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there')).toBeInTheDocument();
    });

    it('should render message input', () => {
      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByTestId('message-input')).toBeInTheDocument();
      expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<ChatWindow {...defaultProps} loading={true} messages={[]} />);

      expect(screen.getByText('Loading messages...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const error = 'Failed to load messages';
      render(<ChatWindow {...defaultProps} error={error} />);

      expect(screen.getByText(`Error: ${error}`)).toBeInTheDocument();
    });
  });

  describe('conversation info', () => {
    it('should display direct conversation info', () => {
      render(<ChatWindow {...defaultProps} />);

      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('Direct message')).toBeInTheDocument();
    });

    it('should display group conversation info', () => {
      const groupConversation = {
        ...mockConversation,
        type: 'group',
        title: 'Team Chat',
        participants: ['user1', 'user2', 'user3', 'user4']
      };

      render(<ChatWindow {...defaultProps} conversation={groupConversation} />);

      expect(screen.getByText('Team Chat')).toBeInTheDocument();
      expect(screen.getByText('4 participants')).toBeInTheDocument();
    });

    it('should display group without title', () => {
      const groupConversation = {
        ...mockConversation,
        type: 'group',
        participants: ['user1', 'user2', 'user3']
      };

      render(<ChatWindow {...defaultProps} conversation={groupConversation} />);

      expect(screen.getByText('Group Chat')).toBeInTheDocument();
      expect(screen.getByText('3 participants')).toBeInTheDocument();
    });
  });

  describe('message interactions', () => {
    it('should call onSendMessage when message is sent', () => {
      const mockOnSendMessage = jest.fn();
      render(<ChatWindow {...defaultProps} onSendMessage={mockOnSendMessage} />);

      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should disable send button when sending', () => {
      render(<ChatWindow {...defaultProps} sending={true} />);

      const sendButton = screen.getByText('Sending...');
      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when no conversation', () => {
      render(<ChatWindow {...defaultProps} conversation={null} />);

      expect(screen.getByText('Welcome to Chat')).toBeInTheDocument();
      expect(screen.queryByText('Send')).not.toBeInTheDocument();
    });
  });

  describe('load more functionality', () => {
    it('should show load more button when hasMore is true', () => {
      render(<ChatWindow {...defaultProps} hasMore={true} />);

      expect(screen.getByText('Load more messages')).toBeInTheDocument();
    });

    it('should not show load more button when hasMore is false', () => {
      render(<ChatWindow {...defaultProps} hasMore={false} />);

      expect(screen.queryByText('Load more messages')).not.toBeInTheDocument();
    });

    it('should call onLoadMore when load more button is clicked', () => {
      const mockOnLoadMore = jest.fn();
      render(<ChatWindow {...defaultProps} onLoadMore={mockOnLoadMore} />);

      const loadMoreButton = screen.getByText('Load more messages');
      fireEvent.click(loadMoreButton);

      expect(mockOnLoadMore).toHaveBeenCalled();
    });

    it('should disable load more button when loading', () => {
      render(<ChatWindow {...defaultProps} loading={true} />);

      const loadMoreButton = screen.getByText('Loading...');
      expect(loadMoreButton).toBeDisabled();
    });
  });

  describe('mark as read', () => {
    it('should call onMarkAsRead when conversation changes', () => {
      const mockOnMarkAsRead = jest.fn();
      const { rerender } = render(
        <ChatWindow {...defaultProps} onMarkAsRead={mockOnMarkAsRead} />
      );

      // Change conversation
      const newConversation = { ...mockConversation, id: 'conv2' };
      rerender(<ChatWindow {...defaultProps} conversation={newConversation} onMarkAsRead={mockOnMarkAsRead} />);

      expect(mockOnMarkAsRead).toHaveBeenCalled();
    });
  });

  describe('scroll handling', () => {
    it('should handle scroll to load more messages', () => {
      const mockOnLoadMore = jest.fn().mockResolvedValue();
      render(<ChatWindow {...defaultProps} onLoadMore={mockOnLoadMore} />);

      const messagesContainer = screen.getByTestId('messages-container');
      
      // Simulate scroll to top
      Object.defineProperty(messagesContainer, 'scrollTop', {
        value: 0,
        writable: true
      });

      fireEvent.scroll(messagesContainer);

      expect(mockOnLoadMore).toHaveBeenCalled();
    });

    it('should not load more if not at top', () => {
      const mockOnLoadMore = jest.fn();
      render(<ChatWindow {...defaultProps} onLoadMore={mockOnLoadMore} />);

      const messagesContainer = screen.getByTestId('messages-container');
      
      // Simulate scroll not at top
      Object.defineProperty(messagesContainer, 'scrollTop', {
        value: 100,
        writable: true
      });

      fireEvent.scroll(messagesContainer);

      expect(mockOnLoadMore).not.toHaveBeenCalled();
    });

    it('should not load more if no more messages', () => {
      const mockOnLoadMore = jest.fn();
      render(<ChatWindow {...defaultProps} hasMore={false} onLoadMore={mockOnLoadMore} />);

      const messagesContainer = screen.getByTestId('messages-container');
      
      Object.defineProperty(messagesContainer, 'scrollTop', {
        value: 0,
        writable: true
      });

      fireEvent.scroll(messagesContainer);

      expect(mockOnLoadMore).not.toHaveBeenCalled();
    });
  });

  describe('message display', () => {
    it('should show messages in correct order', () => {
      render(<ChatWindow {...defaultProps} />);

      const messages = screen.getAllByTestId(/^message-msg/);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toHaveAttribute('data-testid', 'message-msg1');
      expect(messages[1]).toHaveAttribute('data-testid', 'message-msg2');
    });

    it('should handle empty messages array', () => {
      render(<ChatWindow {...defaultProps} messages={[]} />);

      expect(screen.queryByTestId(/^message-msg/)).not.toBeInTheDocument();
    });
  });

  describe('conversation actions', () => {
    it('should render conversation info button', () => {
      render(<ChatWindow {...defaultProps} />);

      const infoButton = screen.getByTitle('Conversation info');
      expect(infoButton).toBeInTheDocument();
    });
  });
});
