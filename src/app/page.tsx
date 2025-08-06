'use client';

import React, { useState } from 'react';
import ChatLayout from '@/components/ChatLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { useAuth } from '@/hooks/useAuth';
import { type AgentType } from '@/services/aiChatService';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('auto');

  const handleNewChat = () => {
    // Reset chat and scroll to top
    window.location.reload();
  };

  return (
    <ChatLayout 
      selectedAgent={selectedAgent}
      onAgentChange={setSelectedAgent}
      onNewChat={handleNewChat}
    >
      <ChatInterface 
        selectedAgent={selectedAgent}
        className="h-full"
      />
    </ChatLayout>
  );
}
