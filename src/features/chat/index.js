/**
 * Chat Feature
 * Real-time messaging system for the Physical app
 */

// Components
export { default as ChatList } from './components/ChatList.js';
export { default as ChatWindow } from './components/ChatWindow.js';
export { default as MessageInput } from './components/MessageInput.js';
export { default as MessageBubble } from './components/MessageBubble.js';

// Hooks
export { useChat } from './hooks/useChat.js';
export { useMessages } from './hooks/useMessages.js';

// Services
export { ChatManager } from './services/chatManager.js';
export { MessageService } from './services/messageService.js';
