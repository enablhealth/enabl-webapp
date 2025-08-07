/**
 * AI Chat Interface Component
 * 
 * Main chat interface for interacting with Enabl AI agents
 * Supports guest and authenticated users with different capabilities
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { aiChatService, type ChatMessage, type AgentType } from '@/services/aiChatService';
import FileUpload, { FilePreview, type UploadedFile } from '@/components/FileUpload';
import { 
  Send, 
  Bot, 
  User, 
  Brain, 
  FileText, 
  Users, 
  Loader2,
  MessageCircle,
  Calendar,
  Paperclip,
  X
} from 'lucide-react';

interface ChatInterfaceProps {
  className?: string;
  selectedAgent?: AgentType;
  showAgentSelector?: boolean;
  initialMessages?: ChatMessage[];
  initialSessionId?: string;
  onNewMessage?: () => void;
}

const agentInfo = {
  'health-assistant': {
    name: 'Health Assistant',
    icon: Brain,
    description: 'General health guidance and wellness advice',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  'community-agent': {
    name: 'Community Agent',
    icon: Users,
    description: 'Research articles and community insights',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  'document-agent': {
    name: 'Document Agent',
    icon: FileText,
    description: 'Medical document analysis and interpretation',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  'appointment-agent': {
    name: 'Appointment Agent',
    icon: Calendar,
    description: 'Medication reminders and appointment scheduling',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  'auto': {
    name: 'Auto-Select',
    icon: Bot,
    description: 'Automatically choose the best agent for your question',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

export default function ChatInterface({ 
  className = '', 
  selectedAgent = 'auto',
  showAgentSelector = false,
  initialMessages = [],
  initialSessionId = '',
  onNewMessage
}: ChatInterfaceProps) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(initialSessionId);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session
  useEffect(() => {
    // Don't initialize a new session if we're loading a conversation
    if (initialMessages.length > 0 && initialSessionId) {
      return;
    }

    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: isAuthenticated 
        ? `Hello ${user?.name || 'there'}! I'm your Enabl Health Assistant. How can I help you with your health questions today?`
        : "Welcome to Enabl Health! I'm here to help with your health questions. Note: As a guest, your conversation won&apos;t be saved. Sign in to save your chat history.",
      timestamp: new Date(),
      agentType: 'health-assistant',
    };

    setMessages([welcomeMessage]);
  }, [isAuthenticated, user, initialMessages.length, initialSessionId]);

  // Handle changes in initial messages (when loading a conversation)
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
    if (initialSessionId) {
      setSessionId(initialSessionId);
    }
  }, [initialMessages, initialSessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim() || (uploadedFiles.length > 0 ? `Uploaded ${uploadedFiles.length} file(s) for analysis` : ''),
      timestamp: new Date(),
      sessionId,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiChatService.sendMessage({
        message: inputMessage.trim() || 'Please analyze the uploaded documents',
        userId: user?.userId || 'anonymous',
        agentType: uploadedFiles.length > 0 ? 'document-agent' : selectedAgent,
        sessionId,
        documentId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp),
        agentType: response.agentType,
        citations: response.citations,
        sessionId: response.sessionId,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Notify parent component about new message (to refresh recent chats)
      onNewMessage?.();
      
      // Clear uploaded files after sending
      if (uploadedFiles.length > 0) {
        setUploadedFiles([]);
        setShowFileUpload(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
        agentType: 'health-assistant',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAgentIcon = (agentType?: AgentType) => {
    const IconComponent = agentInfo[agentType || 'health-assistant']?.icon || Brain;
    return <IconComponent className="w-4 h-4" />;
  };

  const getAgentBadge = (agentType?: AgentType) => {
    if (!agentType || agentType === 'auto') return null;
    
    const agent = agentInfo[agentType];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${agent.color}`}>
        {getAgentIcon(agentType)}
        <span>{agent.name}</span>
      </span>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Agent selector - only show if showAgentSelector is true */}
      {showAgentSelector && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {Object.entries(agentInfo).map(([key, agent]) => {
              const isSelected = selectedAgent === key;
              const IconComponent = agent.icon;
              
              return (
                <button
                  key={key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? agent.color + ' border'
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  title={agent.description}
                  disabled
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{agent.name}</span>
                </button>
              );
            })}
          </div>
          {!isAuthenticated && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              Guest mode: Conversations won&apos;t be saved. Sign in to save your chat history.
            </p>
          )}
        </div>
      )}

      {/* Current agent indicator */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {(() => {
            const agent = agentInfo[selectedAgent];
            const IconComponent = agent.icon;
            return (
              <>
                <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {agent.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  • {agent.description}
                </span>
              </>
            );
          })()}
        </div>
        {!isAuthenticated && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            Guest mode active - Sign in to save conversations
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  {getAgentIcon(message.agentType)}
                </div>
              )}
              
              <div
                className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-lg rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 rounded-lg rounded-bl-sm'
                } px-4 py-3`}
              >
                <div className="flex items-start gap-2 mb-1">
                  {message.role === 'assistant' && getAgentBadge(message.agentType)}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sources:</p>
                    <ul className="text-xs space-y-1">
                      {message.citations.map((citation, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-300">
                          • {citation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg rounded-bl-sm px-4 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Thinking...
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        {/* File Upload Section */}
        {uploadedFiles.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Attached Files ({uploadedFiles.length})
              </span>
              <button
                onClick={() => setUploadedFiles([])}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2"
                >
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-32">
                    {file.name}
                  </span>
                  <button
                    onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Upload files"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              {showFileUpload && (
                <div className="absolute bottom-full mb-2 left-0 z-50">
                  <FileUpload
                    onFilesSelected={(files) => {
                      setUploadedFiles(prev => [...prev, ...files]);
                      setShowFileUpload(false);
                    }}
                    maxFiles={5}
                    maxFileSize={10} // 10MB
                    acceptedTypes={['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']}
                  />
                </div>
              )}
            </div>
            
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your health..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputMessage.trim() && uploadedFiles.length === 0) || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
