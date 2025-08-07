'use client';

import React, { useState } from 'react';
import ChatLayout from '@/components/ChatLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { type AgentType, type ChatMessage } from '@/services/aiChatService';

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('auto');
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewChat = () => {
    // Clear current conversation and reset
    setCurrentMessages([]);
    setCurrentSessionId('');
    setSelectedAgent('auto');
    // Trigger refresh of recent chats
    setRefreshKey(prev => prev + 1);
  };

  const handleLoadConversation = (sessionId: string, messages: ChatMessage[]) => {
    console.log('📄 handleLoadConversation called with:', { sessionId, messagesCount: messages.length });
    setCurrentSessionId(sessionId);
    setCurrentMessages(messages);
    // Set the agent type based on the first message with an agent type
    const firstMessageWithAgent = messages.find(msg => msg.agentType && msg.agentType !== 'auto');
    if (firstMessageWithAgent && firstMessageWithAgent.agentType) {
      setSelectedAgent(firstMessageWithAgent.agentType);
    }
  };

  const refreshRecentChats = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleNewMessage = () => {
    // Trigger refresh of recent chats when a new message is sent
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ChatLayout 
      selectedAgent={selectedAgent}
      onAgentChange={setSelectedAgent}
      onNewChat={handleNewChat}
      onLoadConversation={handleLoadConversation}
      refreshKey={refreshKey}
    >
      <ChatInterface 
        selectedAgent={selectedAgent}
        className="h-full"
        initialMessages={currentMessages}
        initialSessionId={currentSessionId}
        onNewMessage={handleNewMessage}
      />
    </ChatLayout>
  );
}
