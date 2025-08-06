/**
 * Chat Layout Component
 * 
 * Main layout with left sidebar navigation similar to ChatGPT/Perplexity
 * Includes conversation history, agent selection, and user controls
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginModal from '@/components/LoginModal';
import UserMenu from '@/components/UserMenu';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import { type AgentType } from '@/services/aiChatService';
import { 
  Brain, 
  Users, 
  FileText, 
  Calendar, 
  Bot, 
  Plus, 
  Menu, 
  X, 
  MessageSquare,
  Settings,
  LogIn,
  Sparkles
} from 'lucide-react';

interface ChatLayoutProps {
  children: React.ReactNode;
  selectedAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
  onNewChat?: () => void;
}

const agentInfo = {
  'health-assistant': {
    name: 'Health Assistant',
    icon: Brain,
    description: 'General health guidance and wellness advice',
    color: 'text-green-600 bg-green-50 border-green-200',
    darkColor: 'dark:text-green-400 dark:bg-green-900/20 dark:border-green-800',
  },
  'community-agent': {
    name: 'Community Agent',
    icon: Users,
    description: 'Research articles and community insights',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    darkColor: 'dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800',
  },
  'document-agent': {
    name: 'Document Agent',
    icon: FileText,
    description: 'Medical document analysis and interpretation',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    darkColor: 'dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800',
  },
  'appointment-agent': {
    name: 'Appointment Agent',
    icon: Calendar,
    description: 'Medication reminders and appointment scheduling',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    darkColor: 'dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800',
  },
  'auto': {
    name: 'Auto-Select',
    icon: Bot,
    description: 'Automatically choose the best agent for your question',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    darkColor: 'dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700',
  },
};

export default function ChatLayout({ 
  children, 
  selectedAgent, 
  onAgentChange, 
  onNewChat 
}: ChatLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

  const handleSignInClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleAccountSettings = () => {
    setIsAccountSettingsOpen(true);
  };

  const handleNewChat = () => {
    onNewChat?.();
    setIsSidebarOpen(false);
  };

  const handleAgentSelect = (agent: AgentType) => {
    onAgentChange(agent);
    setIsSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Enabl Health
          </h1>
        </div>
        
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* AI Agents */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          AI Agents
        </h2>
        <div className="space-y-2">
          {Object.entries(agentInfo).map(([key, agent]) => {
            const isSelected = selectedAgent === key;
            const IconComponent = agent.icon;
            
            return (
              <button
                key={key}
                onClick={() => handleAgentSelect(key as AgentType)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? `${agent.color} ${agent.darkColor} border`
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
                title={agent.description}
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span className="text-left truncate">{agent.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Conversations (Placeholder) */}
      <div className="flex-1 p-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Recent Chats
        </h2>
        {isAuthenticated ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm cursor-pointer">
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Blood pressure questions</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm cursor-pointer">
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Medication reminders setup</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm cursor-pointer">
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Lab results review</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to view your conversation history
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ) : isAuthenticated ? (
          <div className="space-y-2">
            <UserMenu onAccountSettings={handleAccountSettings} />
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleSignInClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3">
              Sign in to save conversations and access all features
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative flex flex-col flex-1 w-64 max-w-xs bg-white dark:bg-gray-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900 dark:text-white">Enabl Health</span>
          </div>
          
          <div className="w-6" /> {/* Spacer for centering */}
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      
      <AccountSettingsModal 
        isOpen={isAccountSettingsOpen} 
        onClose={() => setIsAccountSettingsOpen(false)} 
      />
    </div>
  );
}
