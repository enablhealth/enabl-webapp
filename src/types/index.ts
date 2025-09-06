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
 * Document interfaces for file management
 */
export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  uploadedAt: string;
  tags?: string[];
  category?: string;
  userId: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  category: 'medical' | 'insurance' | 'lab' | 'prescription' | 'other';
  url: string;
  thumbnailUrl?: string;
  aiAnalysis?: {
    summary: string;
    keyPoints: string[];
    extractedData: Record<string, any>;
    lastAnalyzed: string;
  };
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
