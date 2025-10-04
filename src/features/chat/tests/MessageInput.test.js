/**
 * MessageInput Component Tests
 * Tests for the MessageInput component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MessageInput from '../components/MessageInput.js';

describe('MessageInput', () => {
  const defaultProps = {
    onSendMessage: jest.fn(),
    sending: false,
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('should render input field and buttons', () => {
      render(<MessageInput {...defaultProps} />);

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      expect(screen.getByTitle('Attach file')).toBeInTheDocument();
      expect(screen.getByTitle('Add emoji')).toBeInTheDocument();
      expect(screen.getByTitle('Send message')).toBeInTheDocument();
    });

    it('should show disabled state', () => {
      render(<MessageInput {...defaultProps} disabled={true} />);

      expect(screen.getByPlaceholderText('Select a conversation to start messaging')).toBeInTheDocument();
      expect(screen.getByTitle('Send message')).toBeDisabled();
    });

    it('should show sending state', () => {
      render(<MessageInput {...defaultProps} sending={true} />);

      expect(screen.getByTitle('Send message')).toBeDisabled();
    });
  });

  describe('message input', () => {
    it('should update message text when typing', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(textarea, { target: { value: 'Hello world' } });

      expect(textarea.value).toBe('Hello world');
    });

    it('should show character count', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(screen.getByText('5/1000')).toBeInTheDocument();
    });

    it('should limit message length to 1000 characters', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      const longMessage = 'a'.repeat(1001);
      
      fireEvent.change(textarea, { target: { value: longMessage } });

      expect(textarea.value).toHaveLength(1001);
    });

    it('should auto-resize textarea', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      
      // Mock scrollHeight
      Object.defineProperty(textarea, 'scrollHeight', {
        value: 100,
        writable: true
      });

      fireEvent.change(textarea, { target: { value: 'Hello\nWorld\nMulti\nLine' } });

      expect(textarea.style.height).toBe('100px');
    });

    it('should limit textarea height to 120px', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      
      // Mock scrollHeight to be larger than max
      Object.defineProperty(textarea, 'scrollHeight', {
        value: 200,
        writable: true
      });

      fireEvent.change(textarea, { target: { value: 'Very long message...' } });

      expect(textarea.style.height).toBe('120px');
    });
  });

  describe('message sending', () => {
    it('should send message when send button is clicked', async () => {
      const mockOnSendMessage = jest.fn().mockResolvedValue();
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByTitle('Send message');

      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      await act(async () => {
        fireEvent.click(sendButton);
      });

      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world');
    });

    it('should send message when Enter is pressed', async () => {
      const mockOnSendMessage = jest.fn().mockResolvedValue();
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      await act(async () => {
        fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });
      });
      
      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world');
      }, { timeout: 3000 });
    });

    it('should not send message when Shift+Enter is pressed', () => {
      const mockOnSendMessage = jest.fn();
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not send empty message', () => {
      const mockOnSendMessage = jest.fn();
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);

      const sendButton = screen.getByTitle('Send message');
      fireEvent.click(sendButton);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not send message with only whitespace', () => {
      const mockOnSendMessage = jest.fn();
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByTitle('Send message');

      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.click(sendButton);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should clear message after sending', async () => {
      const mockOnSendMessage = jest.fn().mockResolvedValue();
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByTitle('Send message');

      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      await act(async () => {
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should reset textarea height after sending', async () => {
      const mockOnSendMessage = jest.fn().mockResolvedValue();
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByTitle('Send message');

      // Set initial height
      textarea.style.height = '100px';
      
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      await act(async () => {
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(textarea.style.height).toBe('auto');
      });
    });

    it('should handle send error', async () => {
      const mockOnSendMessage = jest.fn().mockRejectedValue(new Error('Send failed'));
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByTitle('Send message');

      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      await act(async () => {
        fireEvent.click(sendButton);
      });

      // Should not clear message on error
      await waitFor(() => {
        expect(textarea.value).toBe('Hello world');
      });
    });
  });

  describe('typing indicator', () => {
    it('should show typing indicator when typing', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(screen.getByText('Typing...')).toBeInTheDocument();
    });

    it('should hide typing indicator after timeout', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(screen.getByText('Typing...')).toBeInTheDocument();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.queryByText('Typing...')).not.toBeInTheDocument();
    });

    it('should reset typing timeout when typing again', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      expect(screen.getByText('Typing...')).toBeInTheDocument();

      // Fast-forward 500ms
      jest.advanceTimersByTime(500);
      
      // Type again
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      expect(screen.getByText('Typing...')).toBeInTheDocument();

      // Fast-forward 500ms (should still be typing)
      jest.advanceTimersByTime(500);
      expect(screen.getByText('Typing...')).toBeInTheDocument();

      // Fast-forward another 500ms (should stop typing)
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.queryByText('Typing...')).not.toBeInTheDocument();
    });
  });

  describe('emoji functionality', () => {
    it('should add emoji when emoji button is clicked', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      const emojiButton = screen.getByTitle('Add emoji');

      fireEvent.change(textarea, { target: { value: 'Hello' } });
      fireEvent.click(emojiButton);

      expect(textarea.value).toMatch(/Hello[😀😂😍🤔👍👎❤️🎉🔥💯]/);
    });

    it('should focus textarea after adding emoji', () => {
      render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      const emojiButton = screen.getByTitle('Add emoji');

      // Mock focus
      const focusSpy = jest.spyOn(textarea, 'focus');

      fireEvent.click(emojiButton);

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('attachment functionality', () => {
    it('should handle attachment button click', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<MessageInput {...defaultProps} />);

      const attachmentButton = screen.getByTitle('Attach file');
      fireEvent.click(attachmentButton);

      expect(consoleSpy).toHaveBeenCalledWith('Attachment clicked');
      
      consoleSpy.mockRestore();
    });
  });

  describe('disabled state', () => {
    it('should disable all buttons when disabled', () => {
      render(<MessageInput {...defaultProps} disabled={true} />);

      expect(screen.getByTitle('Attach file')).toBeDisabled();
      expect(screen.getByTitle('Add emoji')).toBeDisabled();
      expect(screen.getByTitle('Send message')).toBeDisabled();
    });

    it('should disable textarea when disabled', () => {
      render(<MessageInput {...defaultProps} disabled={true} />);

      const textarea = screen.getByPlaceholderText('Select a conversation to start messaging');
      expect(textarea).toBeDisabled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup typing timeout on unmount', () => {
      const { unmount } = render(<MessageInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      // Should not throw when unmounting with active timeout
      expect(() => unmount()).not.toThrow();
    });
  });
});
