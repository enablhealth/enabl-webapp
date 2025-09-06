/**
 * Chat Layout Component
 * 
 * Main layout with left sidebar navigation similar to ChatGPT/Perplexity
 * Includes conversation history, agent selection, and user controls
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRecentChats } from '@/hooks/useRecentChats';
import LoginModal from '@/components/LoginModal';
import UserMenu from '@/components/UserMenu';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import { type AgentType, type ChatMessage } from '@/services/aiChatService';
import { recentChatsService } from '@/services/recentChatsService';
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
  LogIn,
  Sparkles,
  Loader2,
  MoreVertical,
  Pin as PinIcon,
  Trash2
} from 'lucide-react';

interface ChatLayoutProps {
  children: React.ReactNode;
  selectedAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
  onNewChat?: () => void;
  onLoadConversation?: (sessionId: string, messages: ChatMessage[]) => void;
  refreshKey?: number;
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
  onNewChat,
  onLoadConversation,
  refreshKey
}: ChatLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { recentChats, isLoading: isLoadingChats, refreshRecentChats, loadConversation, deleteConversation } = useRecentChats(user?.userId || null, refreshKey);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [pinnedSessionIds, setPinnedSessionIds] = useState<string[]>([]);
  const [hiddenSessionIds, setHiddenSessionIds] = useState<string[]>([]);
  const chatsScrollRef = React.useRef<HTMLDivElement | null>(null);

  // Load pinned sessions from localStorage per user
  React.useEffect(() => {
    const key = `enabl:pinned:${user?.userId || 'anonymous'}`;
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      setPinnedSessionIds(raw ? JSON.parse(raw) : []);
    } catch {}
  }, [user?.userId]);

  // Load hidden (deleted) sessions per user as a client-side fallback
  React.useEffect(() => {
    const key = `enabl:hidden:${user?.userId || 'anonymous'}`;
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      setHiddenSessionIds(raw ? JSON.parse(raw) : []);
    } catch {}
  }, [user?.userId]);

  const persistPinned = (next: string[]) => {
    setPinnedSessionIds(next);
    const key = `enabl:pinned:${user?.userId || 'anonymous'}`;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(next));
      }
    } catch {}
  };

  const persistHidden = (next: string[]) => {
    setHiddenSessionIds(next);
    const key = `enabl:hidden:${user?.userId || 'anonymous'}`;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(next));
      }
    } catch {}
  };

  const isPinned = (id: string) => pinnedSessionIds.includes(id);
  const togglePin = (id: string) => {
    const next = isPinned(id)
      ? pinnedSessionIds.filter((x) => x !== id)
      : [...pinnedSessionIds, id];
    persistPinned(next);
  };

  // Close kebab menu on outside click or Escape
  React.useEffect(() => {
    if (!menuOpenFor) return;
    const handleDocClick = () => setMenuOpenFor(null);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpenFor(null);
    };
    document.addEventListener('click', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpenFor]);

  const handleSignInClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleAccountSettings = () => {
    setIsAccountSettingsOpen(true);
  };

  const handleNewChat = () => {
    onNewChat?.();
    setIsSidebarOpen(false);
  setActiveSessionId(null);
  setMenuOpenFor(null);
    // Refresh recent chats when starting a new chat
    if (isAuthenticated) {
      refreshRecentChats();
    }
  };

  const handleAgentSelect = (agent: AgentType) => {
    onAgentChange(agent);
    setIsSidebarOpen(false);
  };

  const handleLoadConversation = async (sessionId: string) => {
    console.log('🔄 handleLoadConversation called with sessionId:', sessionId);
    console.log('🔄 onLoadConversation exists:', !!onLoadConversation);
    console.log('🔄 user?.userId:', user?.userId);
    // Optimistically mark as active for immediate visual feedback
    setActiveSessionId(sessionId);
    
    if (!onLoadConversation || !user?.userId) {
      console.log('❌ Early return - missing onLoadConversation or userId');
      return;
    }
    
    try {
      console.log('🔄 Calling loadConversation...');
      const conversation = await loadConversation(sessionId);
      console.log('🔄 loadConversation response:', conversation);
      
      if (conversation && conversation.messages.length > 0) {
        console.log('🔄 Converting messages:', conversation.messages.length);
        // Convert the conversation messages to the format expected by the chat interface
        const formattedMessages = conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          agentType: msg.agent_type as AgentType,
          sessionId: sessionId
        }));
        
        console.log('🔄 Calling onLoadConversation with formatted messages:', formattedMessages.length);
        onLoadConversation(sessionId, formattedMessages);
        setIsSidebarOpen(false);
      } else {
        console.log('❌ No conversation data or empty messages');
      }
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
    }
  };

  // Order chats: pinned first (preserving recency within groups)
  const displayChats = React.useMemo(() => {
    const copy = [...recentChats];
    const byTime = (ts: string) => new Date(ts).getTime();
    copy.sort((a, b) => byTime(b.last_message_time) - byTime(a.last_message_time));
    const visible = copy.filter((c) => !hiddenSessionIds.includes(c.session_id));
    const pinned = visible.filter((c) => isPinned(c.session_id));
    const others = visible.filter((c) => !isPinned(c.session_id));
    return [...pinned, ...others];
  }, [recentChats, pinnedSessionIds, hiddenSessionIds]);

  const SidebarContent = () => (
  <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              enablhealth
            </h1>
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
              BETA
            </span>
          </div>
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

    {/* Recent Conversations */}
  <div ref={chatsScrollRef} className="flex-1 min-h-0 p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Recent Chats
        </h2>
        {isAuthenticated ? (
      <div className="space-y-2">
            {isLoadingChats ? (
              <div className="flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span>Loading chats...</span>
              </div>
            ) : displayChats.length > 0 ? (
              displayChats.map((chat) => {
                const agentInfo = recentChatsService.getAgentDisplayInfo(chat.agent_type);
                const formattedTime = recentChatsService.formatLastActivity(chat.last_message_time);
                const preview = recentChatsService.formatPreview(chat.preview, 40);
                const isActive = activeSessionId === chat.session_id;
                
                return (
                  <div
                    key={chat.session_id}
                    onClick={() => {
                      console.log('🖱️ Chat item clicked:', chat.session_id);
                      handleLoadConversation(chat.session_id);
                    }}
                    className={`relative flex flex-col gap-1 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 text-sm cursor-pointer group transition-colors border ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800'
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className={`text-xs font-medium ${agentInfo.color} dark:opacity-80`}>
                        {agentInfo.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
                        {formattedTime}
                      </span>
                      {isPinned(chat.session_id) && (
                        <PinIcon className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 ml-2" />
                      )}
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700"
                        aria-haspopup="menu"
                        aria-expanded={menuOpenFor === chat.session_id}
                        title="More actions"
                        type="button"
                        onMouseDown={(e) => {
                          // Prevent default focus/scroll jumps and stop bubbling
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const container = chatsScrollRef.current;
                          const prevTop = container ? container.scrollTop : null;
                          setMenuOpenFor((prev) => (prev === chat.session_id ? null : chat.session_id));
                          if (prevTop !== null) {
                            requestAnimationFrame(() => {
                              if (container) container.scrollTop = prevTop;
                            });
                          }
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="ml-6 text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 line-clamp-2">
                      {preview}
                    </div>

                    {menuOpenFor === chat.session_id && (
                      <div
                        className="absolute right-2 top-8 z-10 w-36 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1"
                        role="menu"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          // Keep focus from causing scroll adjustments
                          e.preventDefault();
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(chat.session_id);
                            setMenuOpenFor(null);
                          }}
                        >
                          <PinIcon className="w-4 h-4" />
                          {isPinned(chat.session_id) ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          role="menuitem"
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const confirmed = window.confirm('Delete this chat? This cannot be undone.');
                            if (!confirmed) return;
                            const ok = await deleteConversation(chat.session_id);
                            if (ok) {
                              if (activeSessionId === chat.session_id) setActiveSessionId(null);
                              if (isPinned(chat.session_id)) persistPinned(pinnedSessionIds.filter((x) => x !== chat.session_id));
                              refreshRecentChats();
                            } else {
                              // Fallback: hide locally so the UX still removes the chat
                              const nextHidden = Array.from(new Set([...hiddenSessionIds, chat.session_id]));
                              persistHidden(nextHidden);
                              if (activeSessionId === chat.session_id) setActiveSessionId(null);
                            }
                            setMenuOpenFor(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No recent conversations. Start a new chat to begin!
              </div>
            )}
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
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:min-h-0">
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative flex flex-col flex-1 w-64 max-w-xs bg-white dark:bg-gray-800 h-full min-h-0">
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
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
              BETA
            </span>
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
