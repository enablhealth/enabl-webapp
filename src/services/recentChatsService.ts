/**
 * Recent Chats Service for Enabl Health
 * 
 * Handles fetching and managing user's recent conversation history
 */

export interface RecentChatSession {
  session_id: string;
  last_message_time: string;
  preview: string;
  agent_type: string | null;
  last_activity: string;
}

export interface RecentChatsResponse {
  recent_chats: RecentChatSession[];
  count: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent_type: string | null;
}

export interface ConversationResponse {
  session_id: string;
  messages: ConversationMessage[];
  count: number;
}

class RecentChatsService {
  private baseUrl: string;

  constructor() {
    // Use the agent router API endpoint for recent chats
    this.baseUrl = process.env.NEXT_PUBLIC_AGENT_ROUTER_URL || 'https://mwfa729td4.execute-api.us-east-1.amazonaws.com/prod';
  }

  /**
   * Get recent chat sessions for a user
   */
  async getRecentChats(userId: string): Promise<RecentChatsResponse> {
    if (!userId || userId === 'anonymous') {
      return { recent_chats: [], count: 0 };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chats/recent?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch recent chats:', response.status, response.statusText);
        return { recent_chats: [], count: 0 };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      return { recent_chats: [], count: 0 };
    }
  }

  /**
   * Get full conversation for a session
   */
  async getConversation(sessionId: string, userId: string): Promise<ConversationResponse> {
    if (!userId || userId === 'anonymous' || !sessionId) {
      return { session_id: sessionId, messages: [], count: 0 };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chats/${encodeURIComponent(sessionId)}?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch conversation:', response.status, response.statusText);
        return { session_id: sessionId, messages: [], count: 0 };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return { session_id: sessionId, messages: [], count: 0 };
    }
  }

  /**
   * Format the preview text for display
   */
  formatPreview(preview: string, maxLength: number = 50): string {
    if (preview.length <= maxLength) {
      return preview;
    }
    return preview.substring(0, maxLength) + '...';
  }

  /**
   * Format the last activity time for display
   */
  formatLastActivity(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInHours < 24 * 7) {
        const days = Math.floor(diffInHours / 24);
        return `${days}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Recently';
    }
  }

  /**
   * Get agent display info
   */
  getAgentDisplayInfo(agentType: string | null) {
    const agentInfo = {
      'health-assistant': { name: 'Health', color: 'text-green-600' },
      'community-agent': { name: 'Community', color: 'text-blue-600' },
      'document-agent': { name: 'Document', color: 'text-purple-600' },
      'appointment-agent': { name: 'Appointment', color: 'text-orange-600' },
    };

    return agentInfo[agentType as keyof typeof agentInfo] || { name: 'Chat', color: 'text-gray-600' };
  }
}

export const recentChatsService = new RecentChatsService();
