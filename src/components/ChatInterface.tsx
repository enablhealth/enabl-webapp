'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginModal from './LoginModal';
import UserMenu from './UserMenu';
import AccountSettingsModal from './AccountSettingsModal';
import ThemeToggle from './ThemeToggle';
import FileUpload, { UploadedFile, FilePreview } from './FileUpload';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: UploadedFile[];
}

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: 'reasoning' | 'speed' | 'balanced' | 'creative';
  description: string;
  icon: string;
  color: string;
}

const agents: Agent[] = [
  {
    id: 'personal-assistant',
    name: 'Personal Assistant',
    description: 'Get help with daily tasks, reminders, and general questions',
    icon: '🤖',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700'
  },
  {
    id: 'appointment-agent',
    name: 'Appointment Agent',
    description: 'Schedule, manage, and track your appointments',
    icon: '📅',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
  },
  {
    id: 'community-agent',
    name: 'Community Agent',
    description: 'Find resources, articles, and health content',
    icon: '🌐',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700'
  },
  {
    id: 'document-agent',
    name: 'Document Agent',
    description: 'Upload, manage, and organize your documents',
    icon: '📄',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700'
  }
];

const aiModels: AIModel[] = [
  {
    id: 'best-enabl',
    name: 'Best (Recommended)',
    provider: 'Enabl AI',
    category: 'balanced',
    description: 'Our recommended model powered by Amazon Titan for optimal performance',
    icon: '⭐',
    color: 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700'
  },
  {
    id: 'titan-text',
    name: 'Amazon Titan',
    provider: 'Amazon',
    category: 'balanced',
    description: 'Reliable performance with AWS integration',
    icon: '☁️',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    category: 'reasoning',
    description: 'Best for complex reasoning and analysis',
    icon: '🧠',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    category: 'balanced',
    description: 'Balanced performance for most tasks',
    icon: '⚖️',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    category: 'reasoning',
    description: 'Advanced reasoning with multimodal capabilities',
    icon: '🎯',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    category: 'speed',
    description: 'Fast responses for quick tasks',
    icon: '⚡',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    category: 'creative',
    description: 'Creative tasks and content generation',
    icon: '✨',
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-700'
  },
  {
    id: 'llama-3',
    name: 'Llama 3',
    provider: 'Meta',
    category: 'balanced',
    description: 'Open-source model with strong performance',
    icon: '🦙',
    color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700'
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    category: 'reasoning',
    description: 'European AI with strong reasoning capabilities',
    icon: '🇪🇺',
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700'
  }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('best-enabl');
  const [showChat, setShowChat] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelSelector) {
        const target = event.target as HTMLElement;
        if (!target.closest('.model-selector')) {
          setShowModelSelector(false);
        }
      }
      if (showFileUpload) {
        const target = event.target as HTMLElement;
        if (!target.closest('.file-upload-dropdown')) {
          setShowFileUpload(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelSelector, showFileUpload]);

  const handleFilesSelected = (files: UploadedFile[]) => {
    // Filter out files with errors
    const validFiles = files.filter(file => !file.error);
    setAttachedFiles(prev => [...prev, ...validFiles]);
    setShowFileUpload(false);
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || (attachedFiles.length > 0 ? `Sent ${attachedFiles.length} file(s)` : ''),
      role: 'user',
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setAttachedFiles([]);
    setIsLoading(true);
    setShowChat(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const agentName = selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : 'Enabl';
      const selectedModelData = aiModels.find(m => m.id === selectedModel);
      const modelName = selectedModelData?.name || 'AI Assistant';
      
      // If "Best" is selected, use Amazon Titan under the hood
      const actualModel = selectedModel === 'best-enabl' ? 'Amazon Titan' : modelName;
      
      // Create response message with file acknowledgment
      let responseContent = `Hello! I'm ${agentName || 'Enabl'} powered by ${actualModel}${selectedModel === 'best-enabl' ? ' (our recommended model)' : ''}.`;
      
      if (newUserMessage.attachments && newUserMessage.attachments.length > 0) {
        const fileNames = newUserMessage.attachments.map(file => file.name).join(', ');
        responseContent += ` I can see you've shared ${newUserMessage.attachments.length} file(s): ${fileNames}. I can help you analyze these files along with your request.`;
      }
      
      if (newUserMessage.content && newUserMessage.content !== `Sent ${newUserMessage.attachments?.length || 0} file(s)`) {
        responseContent += ` Regarding your message: "${newUserMessage.content}"`;
      }
      
      responseContent += ' How can I assist you further?';
      
      if (user?.isGuest) {
        responseContent += '\n\n*Note: As a guest, your chat history won\'t be saved. Sign up to keep your conversations!*';
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      
      // Save to localStorage if user is authenticated and not a guest
      if (isAuthenticated && !user?.isGuest) {
        // Here you would normally save to your backend
        console.log('Chat saved for authenticated user');
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(selectedAgent === agentId ? null : agentId);
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setShowModelSelector(false);
  };

  const getCategoryBadge = (category: string) => {
    const badges = {
      reasoning: { label: 'Reasoning', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
      speed: { label: 'Speed', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
      balanced: { label: 'Balanced', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
      creative: { label: 'Creative', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' }
    };
    return badges[category as keyof typeof badges] || badges.balanced;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="flex flex-col h-screen max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">E</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Enabl Chat</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : 'Personal Assistant'} • {aiModels.find(m => m.id === selectedModel)?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* User Menu - only show if authenticated */}
              {isAuthenticated && (
                <UserMenu onAccountSettings={() => setShowAccountSettings(true)} />
              )}
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Model Selector */}
              <div className="relative model-selector">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span>{aiModels.find(m => m.id === selectedModel)?.icon}</span>
                  <span>{aiModels.find(m => m.id === selectedModel)?.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showModelSelector && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Choose AI Model</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {aiModels.map((model) => {
                          const badge = getCategoryBadge(model.category);
                          const isRecommended = model.id === 'best-enabl';
                          return (
                            <button
                              key={model.id}
                              onClick={() => handleModelSelect(model.id)}
                              className={`w-full text-left p-3 rounded-lg transition-colors relative ${
                                selectedModel === model.id
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                              } ${isRecommended ? 'ring-2 ring-yellow-300 dark:ring-yellow-600' : ''}`}
                            >
                              {isRecommended && (
                                <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
                                  Recommended
                                </div>
                              )}
                              <div className="flex items-start gap-3">
                                <span className="text-lg">{model.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{model.name}</h4>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${badge.color}`}>
                                      {badge.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{model.provider}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{model.description}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowChat(false);
                  setMessages([]);
                  setSelectedAgent(null);
                  setShowModelSelector(false);
                  setAttachedFiles([]);
                  setShowFileUpload(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white dark:bg-gray-800">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {/* File attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {message.attachments.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center gap-2 p-2 rounded ${
                            message.role === 'user'
                              ? 'bg-blue-500/30'
                              : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        >
                          {file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                              message.role === 'user'
                                ? 'bg-blue-400 text-white'
                                : 'bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-200'
                            }`}>
                              {file.type.startsWith('image/') ? '🖼️' : 
                               file.type === 'application/pdf' ? '📄' :
                               file.type.includes('word') ? '📝' :
                               file.type.includes('excel') ? '📊' : '📎'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${
                              message.role === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'
                            }`}>
                              {file.name}
                            </p>
                            <p className={`text-xs ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {Math.round(file.size / 1024)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Message content */}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          {/* File attachments preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Attached files ({attachedFiles.length}):
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {attachedFiles.map((file) => (
                  <FilePreview
                    key={file.id}
                    file={file}
                    onRemove={handleRemoveFile}
                    className="text-sm"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {/* File upload button */}
            <div className="relative file-upload-dropdown">
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Attach files"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              {showFileUpload && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Upload Files
                    </h3>
                    <FileUpload
                      onFilesSelected={handleFilesSelected}
                      maxFiles={5}
                      maxFileSize={10}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-h-[44px] max-h-32 placeholder-gray-400 dark:placeholder-gray-500"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Press Enter to send, Shift+Enter for new line • {attachedFiles.length > 0 ? `${attachedFiles.length} file(s) attached • ` : ''}Click 📎 to attach files
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            {/* Left side - can add logo or other elements here */}
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User Menu or Sign In */}
            {isAuthenticated ? (
              <UserMenu onAccountSettings={() => setShowAccountSettings(true)} />
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-4xl">e</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">enabl</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your AI-powered everyday health assistant. Ask anything or choose an agent below.
          </p>
          {isAuthenticated && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Welcome back, {user?.name}! {user?.isGuest && '(Guest Account - Sign up to save your chats)'}
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          {/* File attachments preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-3">
                Attached files ({attachedFiles.length}):
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {attachedFiles.map((file) => (
                  <FilePreview
                    key={file.id}
                    file={file}
                    onRemove={handleRemoveFile}
                    className="text-sm"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            {/* File upload button */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 file-upload-dropdown">
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                disabled={isLoading}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Attach files"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              {showFileUpload && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Upload Files
                    </h3>
                    <FileUpload
                      onFilesSelected={handleFilesSelected}
                      maxFiles={5}
                      maxFileSize={10}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Enabl anything..."
              className="w-full resize-none border-2 border-gray-200 dark:border-gray-600 rounded-2xl pl-14 pr-16 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg min-h-[60px] max-h-40 shadow-lg placeholder-gray-400 dark:placeholder-gray-500"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            {selectedAgent && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Selected agent:</span>
                <span className="font-medium">{agents.find(a => a.id === selectedAgent)?.name}</span>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Model Selector for Landing Page */}
            <div className="relative model-selector">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <span>{aiModels.find(m => m.id === selectedModel)?.icon}</span>
                <span>{aiModels.find(m => m.id === selectedModel)?.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showModelSelector && (
                <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-10">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Choose AI Model</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {aiModels.map((model) => {
                        const badge = getCategoryBadge(model.category);
                        const isRecommended = model.id === 'best-enabl';
                        return (
                          <button
                            key={model.id}
                            onClick={() => handleModelSelect(model.id)}
                            className={`w-full text-left p-3 rounded-lg transition-colors relative ${
                              selectedModel === model.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                            } ${isRecommended ? 'ring-2 ring-yellow-300 dark:ring-yellow-600' : ''}`}
                          >
                            {isRecommended && (
                              <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
                                Recommended
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <span className="text-lg">{model.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{model.name}</h4>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{model.provider}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">{model.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agent Cards */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Choose an AI Agent
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleAgentSelect(agent.id)}
                className={`cursor-pointer border-2 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg ${
                  selectedAgent === agent.id
                    ? `${agent.color} border-current shadow-lg scale-105`
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{agent.icon}</div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      selectedAgent === agent.id ? 'text-current' : 'text-gray-900 dark:text-white'
                    }`}>
                      {agent.name}
                    </h3>
                    <p className={`text-sm ${
                      selectedAgent === agent.id ? 'text-current' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {agent.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Enabl Health - Your AI-powered everyday health assistant</p>
        </div>
      </div>

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      <AccountSettingsModal 
        isOpen={showAccountSettings} 
        onClose={() => setShowAccountSettings(false)} 
      />
    </div>
  );
}
