/**
 * ChatManager
 * Manages chat conversations and real-time messaging
 */

import { generateDeviceId } from '../../../shared/utils.js';

export class ChatManager {
  constructor() {
    this.dbName = 'PhysicalChatDB';
    this.dbVersion = 1;
    this.db = null;
    this.deviceId = generateDeviceId();
    this.activeChats = new Map();
    this.messageListeners = new Map();
  }

  /**
   * Initialize the chat database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationsStore.createIndex('participants', 'participants', { multiEntry: true });
          conversationsStore.createIndex('lastMessageAt', 'lastMessageAt');
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('conversationId', 'conversationId');
          messagesStore.createIndex('timestamp', 'timestamp');
          messagesStore.createIndex('senderId', 'senderId');
        }

        // Chat settings store
        if (!db.objectStoreNames.contains('chatSettings')) {
          db.createObjectStore('chatSettings', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Create a new conversation
   */
  async createConversation(participants, type = 'direct') {
    const conversation = {
      id: this.generateId(),
      participants: participants,
      type: type,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      lastMessage: null,
      unreadCount: 0,
      isActive: true
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const request = store.add(conversation);

      request.onsuccess = () => resolve(conversation);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const index = store.index('participants');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const conversations = request.result
          .filter(conv => conv.isActive)
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        resolve(conversations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const request = store.get(conversationId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update conversation
   */
  async updateConversation(conversationId, updates) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const getRequest = store.get(conversationId);

      getRequest.onsuccess = () => {
        const conversation = getRequest.result;
        if (!conversation) {
          reject(new Error('Conversation not found'));
          return;
        }

        const updatedConversation = { ...conversation, ...updates };
        const putRequest = store.put(updatedConversation);

        putRequest.onsuccess = () => resolve(updatedConversation);
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations', 'messages'], 'readwrite');
      const conversationsStore = transaction.objectStore('conversations');
      const messagesStore = transaction.objectStore('messages');
      
      // Delete conversation
      const deleteConvRequest = conversationsStore.delete(conversationId);
      
      // Delete all messages in the conversation
      const messagesIndex = messagesStore.index('conversationId');
      const getMessagesRequest = messagesIndex.getAll(conversationId);
      
      if (getMessagesRequest) {
        getMessagesRequest.onsuccess = () => {
          const messages = getMessagesRequest.result || [];
          messages.forEach(message => {
            messagesStore.delete(message.id);
          });
        };
      }

      deleteConvRequest.onsuccess = () => resolve();
      deleteConvRequest.onerror = () => reject(deleteConvRequest.error);
    });
  }

  /**
   * Get chat settings
   */
  async getChatSettings(userId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['chatSettings'], 'readonly');
      const store = transaction.objectStore('chatSettings');
      const request = store.get(userId);

      request.onsuccess = () => {
        const settings = request.result || {
          id: userId,
          notifications: true,
          soundEnabled: true,
          typingIndicators: true,
          readReceipts: true,
          theme: 'light'
        };
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update chat settings
   */
  async updateChatSettings(userId, settings) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['chatSettings'], 'readwrite');
      const store = transaction.objectStore('chatSettings');
      const request = store.put({ id: userId, ...settings });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all chat data
   */
  async clearAllData() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations', 'messages', 'chatSettings'], 'readwrite');
      
      const clearConversations = transaction.objectStore('conversations').clear();
      const clearMessages = transaction.objectStore('messages').clear();
      const clearSettings = transaction.objectStore('chatSettings').clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Check if IndexedDB is available
   */
  isAvailable() {
    return typeof indexedDB !== 'undefined';
  }
}
