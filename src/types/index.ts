/**
 * Message interface for chat conversations
 */
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

/**
 * User interface for authenticated users
 */
export interface User {
  id: string;
  username: string;
  email: string;
  isGuest: boolean;
}

/**
 * Chat session interface
 */
export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
