/**
 * Recent Chats Hook for Enabl Health
 * 
 * Custom React hook for managing user's recent conversation history
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { recentChatsService, type RecentChatSession, type ConversationResponse } from '@/services/recentChatsService';

export interface UseRecentChatsReturn {
  recentChats: RecentChatSession[];
  isLoading: boolean;
  error: string | null;
  refreshRecentChats: () => Promise<void>;
  loadConversation: (sessionId: string) => Promise<ConversationResponse | null>;
}

export function useRecentChats(userId: string | null, refreshKey?: number): UseRecentChatsReturn {
  const [recentChats, setRecentChats] = useState<RecentChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRecentChats = useCallback(async () => {
    if (!userId || userId === 'anonymous') {
      setRecentChats([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await recentChatsService.getRecentChats(userId);
      setRecentChats(response.recent_chats || []);
    } catch (err) {
      console.error('Error fetching recent chats:', err);
      setError('Failed to load recent chats');
      setRecentChats([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadConversation = useCallback(async (sessionId: string): Promise<ConversationResponse | null> => {
    if (!userId || userId === 'anonymous' || !sessionId) {
      return null;
    }

    try {
      const conversation = await recentChatsService.getConversation(sessionId, userId);
      return conversation;
    } catch (err) {
      console.error('Error loading conversation:', err);
      return null;
    }
  }, [userId]);

  // Load recent chats when userId changes or refreshKey changes
  useEffect(() => {
    refreshRecentChats();
  }, [refreshRecentChats, refreshKey]);

  return {
    recentChats,
    isLoading,
    error,
    refreshRecentChats,
    loadConversation,
  };
}
