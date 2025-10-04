/**
 * MessageBubble Component Tests
 * Tests for the MessageBubble component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageBubble from '../components/MessageBubble.js';

describe('MessageBubble', () => {
  const mockMessage = {
    id: 'msg1',
    content: 'Hello world',
    senderId: 'user1',
    timestamp: '2023-01-01T10:00:00Z',
    status: 'sent',
    isOwn: false
  };

  const defaultProps = {
    message: mockMessage,
    showAvatar: true,
    onDelete: jest.fn(),
    onRetry: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render message content', () => {
      render(<MessageBubble {...defaultProps} />);

      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    it('should render with avatar when showAvatar is true', () => {
      render(<MessageBubble {...defaultProps} showAvatar={true} />);

      const avatar = screen.getByText('U');
      expect(avatar).toBeInTheDocument();
      expect(avatar.closest('.message-avatar')).toBeInTheDocument();
    });

    it('should not render avatar when showAvatar is false', () => {
      render(<MessageBubble {...defaultProps} showAvatar={false} />);

      expect(screen.queryByText('U')).not.toBeInTheDocument();
    });

    it('should not show sender name for own messages', () => {
      const ownMessage = { ...mockMessage, isOwn: true };
      render(<MessageBubble {...defaultProps} message={ownMessage} />);

      expect(screen.queryByText('user1')).not.toBeInTheDocument();
    });

    it('should show sender name for other messages with avatar', () => {
      render(<MessageBubble {...defaultProps} showAvatar={true} />);

      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    it('should not show sender name for other messages without avatar', () => {
      render(<MessageBubble {...defaultProps} showAvatar={false} />);

      expect(screen.queryByText('user1')).not.toBeInTheDocument();
    });
  });

  describe('message styling', () => {
    it('should apply own message styling', () => {
      const ownMessage = { ...mockMessage, isOwn: true };
      render(<MessageBubble {...defaultProps} message={ownMessage} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      expect(messageBubble).toHaveClass('own');
    });

    it('should apply other message styling', () => {
      render(<MessageBubble {...defaultProps} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      expect(messageBubble).toHaveClass('other');
    });

    it('should apply with-avatar class when showAvatar is true', () => {
      render(<MessageBubble {...defaultProps} showAvatar={true} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      expect(messageBubble).toHaveClass('with-avatar');
    });
  });

  describe('message metadata', () => {
    it('should display formatted time', () => {
      render(<MessageBubble {...defaultProps} />);

      // Should display time in HH:MM format
      expect(screen.getByText(/11:00/)).toBeInTheDocument();
    });

    it('should display status icon for own messages', () => {
      const ownMessage = { ...mockMessage, isOwn: true, status: 'sent' };
      render(<MessageBubble {...defaultProps} message={ownMessage} />);

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should not display status icon for other messages', () => {
      render(<MessageBubble {...defaultProps} />);

      expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });

    it('should display different status icons', () => {
      const statuses = [
        { status: 'sending', icon: '⏳' },
        { status: 'sent', icon: '✓' },
        { status: 'delivered', icon: '✓✓' },
        { status: 'read', icon: '✓✓' },
        { status: 'failed', icon: '❌' },
        { status: 'pending', icon: '⏸️' }
      ];

      statuses.forEach(({ status, icon }) => {
        const message = { ...mockMessage, isOwn: true, status };
        const { unmount } = render(<MessageBubble {...defaultProps} message={message} />);

        expect(screen.getByText(icon)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('message types', () => {
    it('should display message type icons', () => {
      const messageTypes = [
        { type: 'image', icon: '🖼️' },
        { type: 'file', icon: '📎' },
        { type: 'location', icon: '📍' },
        { type: 'audio', icon: '🎵' },
        { type: 'video', icon: '🎥' }
      ];

      messageTypes.forEach(({ type, icon }) => {
        const message = { ...mockMessage, type };
        const { unmount } = render(<MessageBubble {...defaultProps} message={message} />);

        expect(screen.getByText(icon, { exact: false })).toBeInTheDocument();
        unmount();
      });
    });

    it('should not display icon for text messages', () => {
      const textMessage = { ...mockMessage, type: 'text' };
      render(<MessageBubble {...defaultProps} message={textMessage} />);

      // Should not have any of the type icons
      expect(screen.queryByText('🖼️')).not.toBeInTheDocument();
      expect(screen.queryByText('📎')).not.toBeInTheDocument();
      expect(screen.queryByText('📍')).not.toBeInTheDocument();
      expect(screen.queryByText('🎵')).not.toBeInTheDocument();
      expect(screen.queryByText('🎥')).not.toBeInTheDocument();
    });
  });

  describe('message actions', () => {
    it('should show actions on hover', () => {
      render(<MessageBubble {...defaultProps} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      fireEvent.mouseEnter(messageBubble);

      expect(screen.getByTitle('Delete message')).toBeInTheDocument();
    });

    it('should hide actions when mouse leaves', () => {
      render(<MessageBubble {...defaultProps} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      fireEvent.mouseEnter(messageBubble);
      fireEvent.mouseLeave(messageBubble);

      expect(screen.queryByTitle('Delete message')).not.toBeInTheDocument();
    });

    it('should show retry button for failed messages', () => {
      const failedMessage = { ...mockMessage, status: 'failed' };
      render(<MessageBubble {...defaultProps} message={failedMessage} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      fireEvent.mouseEnter(messageBubble);

      expect(screen.getByTitle('Retry sending')).toBeInTheDocument();
    });

    it('should not show retry button for non-failed messages', () => {
      render(<MessageBubble {...defaultProps} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      fireEvent.mouseEnter(messageBubble);

      expect(screen.queryByTitle('Retry sending')).not.toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('should call onDelete when delete button is clicked', () => {
      const mockOnDelete = jest.fn();
      window.confirm = jest.fn(() => true);
      
      render(<MessageBubble {...defaultProps} onDelete={mockOnDelete} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      fireEvent.mouseEnter(messageBubble);

      const deleteButton = screen.getByTitle('Delete message');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('msg1');
    });

    it('should show confirmation dialog before deleting', () => {
      const mockOnDelete = jest.fn();
      window.confirm = jest.fn(() => true);
      
      render(<MessageBubble {...defaultProps} onDelete={mockOnDelete} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      fireEvent.mouseEnter(messageBubble);

      const deleteButton = screen.getByTitle('Delete message');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this message?');
      expect(mockOnDelete).toHaveBeenCalledWith('msg1');
    });

    it('should not delete if user cancels confirmation', () => {
      const mockOnDelete = jest.fn();
      window.confirm = jest.fn(() => false);
      
      render(<MessageBubble {...defaultProps} onDelete={mockOnDelete} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      fireEvent.mouseEnter(messageBubble);

      const deleteButton = screen.getByTitle('Delete message');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this message?');
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('retry functionality', () => {
    it('should call onRetry when retry button is clicked', () => {
      const mockOnRetry = jest.fn();
      const failedMessage = { ...mockMessage, status: 'failed' };
      
      render(<MessageBubble {...defaultProps} message={failedMessage} onRetry={mockOnRetry} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      fireEvent.mouseEnter(messageBubble);

      const retryButton = screen.getByTitle('Retry sending');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledWith('msg1');
    });
  });

  describe('avatar display', () => {
    it('should display first letter of sender ID', () => {
      render(<MessageBubble {...defaultProps} showAvatar={true} />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('should handle empty sender ID', () => {
      const messageWithEmptySender = { ...mockMessage, senderId: '' };
      render(<MessageBubble {...defaultProps} message={messageWithEmptySender} showAvatar={true} />);

      // Should not crash and should display something
      const avatar = screen.getByText('U'); // Default fallback
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('should format different timestamps correctly', () => {
      const timestamps = [
        '2023-01-01T10:00:00Z', // Should show 10:00
        '2023-01-01T14:30:00Z', // Should show 14:30
        '2023-01-01T09:15:00Z'  // Should show 09:15
      ];

      timestamps.forEach(timestamp => {
        const message = { ...mockMessage, timestamp };
        const { unmount } = render(<MessageBubble {...defaultProps} message={message} />);

        // Extract expected time from timestamp
        const expectedTime = new Date(timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        expect(screen.getByText(expectedTime)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
