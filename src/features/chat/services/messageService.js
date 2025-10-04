/**
 * MessageService
 * Handles message operations and real-time messaging
 */

export class MessageService {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.messageQueue = [];
    this.isOnline = navigator.onLine;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId, senderId, content, type = 'text', metadata = {}) {
    const message = {
      id: this.chatManager.generateId(),
      conversationId: conversationId,
      senderId: senderId,
      content: content,
      type: type,
      metadata: metadata,
      timestamp: new Date().toISOString(),
      status: 'sending',
      isRead: false
    };

    try {
      // Store message locally first
      await this.storeMessage(message);
      
      // Update conversation
      await this.updateConversationLastMessage(conversationId, message);
      
      // Simulate sending (in real app, this would be API call)
      if (this.isOnline) {
        await this.simulateMessageSend(message);
        message.status = 'sent';
        await this.updateMessage(message);
      } else {
        message.status = 'pending';
        await this.updateMessage(message);
        this.messageQueue.push(message);
      }

      return message;
    } catch (error) {
      message.status = 'failed';
      await this.updateMessage(message);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      const transaction = this.chatManager.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('conversationId');
      const request = index.getAll(conversationId);

      request.onsuccess = () => {
        const messages = request.result
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .slice(offset, offset + limit);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store a message
   */
  async storeMessage(message) {
    return new Promise((resolve, reject) => {
      const transaction = this.chatManager.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.add(message);

      request.onsuccess = () => resolve(message);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update a message
   */
  async updateMessage(message) {
    return new Promise((resolve, reject) => {
      const transaction = this.chatManager.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.put(message);

      request.onsuccess = () => resolve(message);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId, userId) {
    return new Promise((resolve, reject) => {
      const transaction = this.chatManager.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const index = store.index('conversationId');
      const request = index.getAll(conversationId);

      request.onsuccess = () => {
        const messages = request.result.filter(msg => 
          msg.senderId !== userId && !msg.isRead
        );

        messages.forEach(message => {
          message.isRead = true;
          store.put(message);
        });

        resolve(messages.length);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId) {
    return new Promise((resolve, reject) => {
      const transaction = this.chatManager.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.delete(messageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update conversation last message
   */
  async updateConversationLastMessage(conversationId, message) {
    const conversation = await this.chatManager.getConversation(conversationId);
    if (conversation) {
      await this.chatManager.updateConversation(conversationId, {
        lastMessage: {
          content: message.content,
          senderId: message.senderId,
          timestamp: message.timestamp
        },
        lastMessageAt: message.timestamp
      });
    }
  }

  /**
   * Simulate message sending (replace with real API call)
   */
  async simulateMessageSend(message) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate network delay
        if (Math.random() < 0.1) {
          reject(new Error('Network error'));
        } else {
          resolve(message);
        }
      }, 500 + Math.random() * 1000);
    });
  }

  /**
   * Retry failed messages
   */
  async retryFailedMessages() {
    const failedMessages = await this.getFailedMessages();
    
    for (const message of failedMessages) {
      try {
        await this.simulateMessageSend(message);
        message.status = 'sent';
        await this.updateMessage(message);
      } catch (error) {
        message.retryCount = (message.retryCount || 0) + 1;
        if (message.retryCount >= this.retryAttempts) {
          message.status = 'failed';
        }
        await this.updateMessage(message);
      }
    }
  }

  /**
   * Get failed messages
   */
  async getFailedMessages() {
    return new Promise((resolve, reject) => {
      const transaction = this.chatManager.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.getAll();

      request.onsuccess = () => {
        const failedMessages = request.result.filter(msg => 
          msg.status === 'failed' || msg.status === 'pending'
        );
        resolve(failedMessages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Process queued messages when online
   */
  async processMessageQueue() {
    if (this.messageQueue.length > 0) {
      const messages = [...this.messageQueue];
      this.messageQueue = [];

      for (const message of messages) {
        try {
          await this.simulateMessageSend(message);
          message.status = 'sent';
          await this.updateMessage(message);
        } catch (error) {
          this.messageQueue.push(message);
        }
      }
    }
  }

  /**
   * Validate message content
   */
  validateMessage(content, type = 'text') {
    const errors = [];

    if (!content || content.trim().length === 0) {
      errors.push('Message content cannot be empty');
    }

    if (content && content.length > 1000) {
      errors.push('Message content cannot exceed 1000 characters');
    }

    if (type === 'text' && content.includes('<script>')) {
      errors.push('Message content contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Format message for display
   */
  formatMessage(message, currentUserId) {
    return {
      ...message,
      isOwn: message.senderId === currentUserId,
      displayTime: this.formatTimestamp(message.timestamp),
      statusIcon: this.getStatusIcon(message.status)
    };
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Get status icon for message
   */
  getStatusIcon(status) {
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      case 'failed': return '❌';
      case 'pending': return '⏸️';
      default: return '';
    }
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    if (isOnline) {
      this.processMessageQueue();
    }
  }
}
