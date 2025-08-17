/**
 * AI Chat Service for Enabl Health
 * 
 * Handles communication with AI agents (Health Assistant, Community, Document)
 * Includes mock responses for development and real API calls for production
 */

import { logger } from '../lib/logger';

export type AgentType = 'health-assistant' | 'community-agent' | 'document-agent' | 'appointment-agent' | 'auto';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentType?: AgentType;
  citations?: string[];
  sessionId?: string;
}

export interface ChatRequest {
  message: string;
  userId: string;
  agentType?: AgentType;
  sessionId?: string;
  context?: string;
  documentId?: string;
}

export interface ChatResponse {
  response: string;
  agentType: AgentType;
  sessionId: string;
  citations?: string[];
  timestamp: string;
  routedTo?: string;
  routingDecision?: 'explicit' | 'inferred';
}

class AIChatService {
  private baseUrl: string;
  private isDevelopment: boolean;
  private shouldUseMockResponses: boolean;

  constructor() {
    // Use the Agent Router API URL
    this.baseUrl = process.env.NEXT_PUBLIC_AGENT_ROUTER_URL || 'https://mwfa729td4.execute-api.us-east-1.amazonaws.com/prod';
    this.isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_APP_ENV === 'development';
    
    // Enable real API calls now that backend is deployed
    // Only use mock responses for guest users or if API fails
    this.shouldUseMockResponses = false;
    
    // Log for debugging
    logger.debug('AIChatService initialized:', {
      isDevelopment: this.isDevelopment,
      shouldUseMockResponses: this.shouldUseMockResponses,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
      baseUrl: this.baseUrl
    });
  }

  /**
   * Send a chat message to the AI agents
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const payload: {
        message: string;
        userId: string;
        agentType: AgentType;
        sessionId?: string;
      } = {
        message: request.message,
        userId: request.userId || 'guest',
        agentType: request.agentType || 'health-assistant'
      };

      if (request.sessionId) {
        payload.sessionId = request.sessionId;
      }

      console.log('Sending message to Agent Router:', { payload, url: `${this.baseUrl}/agents` });

      const response = await fetch(`${this.baseUrl}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Agent Router response:', data);

      // Transform Agent Router response to ChatResponse format
      return {
        response: data.response || data.message || 'No response received',
        agentType: request.agentType || 'health-assistant',
        sessionId: data.sessionId || request.sessionId || this.generateSessionId(),
        timestamp: new Date().toISOString(),
        routedTo: data.routedTo,
        routingDecision: data.routingDecision || 'explicit'
      };
    } catch (error) {
      console.error('Error sending message to Agent Router:', error);
      
      // Fallback to mock response if API fails
      if (this.isDevelopment) {
        console.log('Falling back to mock response');
        return this.getMockResponse(request);
      }
      
      throw error;
    }
  }

  /**
   * Send message to specific agent
   */
  async sendToAgent(agentType: AgentType, request: Omit<ChatRequest, 'agentType'>): Promise<ChatResponse> {
    return this.sendMessage({ ...request, agentType });
  }

  /**
   * Get mock responses for development
   */
  private async getMockResponse(request: ChatRequest): Promise<ChatResponse> {
    console.log('🎭 Generating mock response for:', { 
      agentType: request.agentType, 
      userId: request.userId, 
      message: request.message.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const agentType = request.agentType || this.inferAgentType(request.message);
    
    const response: ChatResponse = {
      response: this.generateMockResponse(request.message, agentType),
      agentType,
      sessionId: request.sessionId || `mock-${Date.now()}`,
      citations: this.generateMockCitations(agentType),
      timestamp: new Date().toISOString(),
      routedTo: agentType,
      routingDecision: (request.agentType ? 'explicit' : 'inferred') as 'explicit' | 'inferred',
    };

    console.log('✨ Mock response generated:', {
      agentType: response.agentType,
      responsePreview: response.response.substring(0, 100) + '...',
      sessionId: response.sessionId
    });

    return response;
  }

  /**
   * Infer which agent should handle the message
   */
  private inferAgentType(message: string): AgentType {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('document') || messageLower.includes('report') || messageLower.includes('result')) {
      return 'document-agent';
    }
    
    if (messageLower.includes('research') || messageLower.includes('article') || messageLower.includes('study')) {
      return 'community-agent';
    }
    
    if (messageLower.includes('appointment') || messageLower.includes('reminder') || 
        messageLower.includes('medication') || messageLower.includes('schedule') ||
        messageLower.includes('checkup') || messageLower.includes('follow-up') ||
        messageLower.includes('calendar') || messageLower.includes('remind me')) {
      return 'appointment-agent';
    }
    
    return 'health-assistant';
  }

  /**
   * Generate mock responses based on agent type
   */
  private generateMockResponse(message: string, agentType: AgentType): string {
    const messageLower = message.toLowerCase();
    
    // More dynamic responses based on message content
    if (agentType === 'health-assistant') {
      if (messageLower.includes('headache') || messageLower.includes('pain')) {
        return "I understand you're experiencing headaches. This can be caused by various factors including stress, dehydration, lack of sleep, or tension. For persistent headaches, it's important to consult with a healthcare professional. In the meantime, ensure you're staying hydrated, getting adequate rest, and managing stress levels.";
      }
      if (messageLower.includes('anxiety') || messageLower.includes('stress')) {
        return "Anxiety and stress are common concerns that many people face. Some helpful strategies include deep breathing exercises, regular physical activity, maintaining a consistent sleep schedule, and mindfulness practices. If you're experiencing persistent anxiety that interferes with daily life, please consider speaking with a mental health professional.";
      }
      if (messageLower.includes('diet') || messageLower.includes('nutrition')) {
        return "A balanced diet is crucial for overall health. Focus on incorporating plenty of fruits, vegetables, whole grains, lean proteins, and healthy fats. Stay hydrated and try to limit processed foods, excessive sugar, and saturated fats. For personalized dietary advice, consider consulting with a registered dietitian.";
      }
      return "Thank you for your health question. I'm here to provide general health information and guidance. While I can offer evidence-based information, please remember that I'm not a substitute for professional medical advice. For specific health concerns, it's always best to consult with your healthcare provider.";
    }
    
    if (agentType === 'appointment-agent') {
      if (messageLower.includes('medication') || messageLower.includes('pill') || messageLower.includes('medicine')) {
        return "I can help you set up medication reminders! To create an effective reminder system, I'll need to know: 1) The name of your medication, 2) How often you need to take it, 3) What time(s) of day, and 4) Your preferred reminder method (notification, SMS, or email). This will help ensure you never miss a dose.";
      }
      if (messageLower.includes('appointment') || messageLower.includes('doctor') || messageLower.includes('schedule')) {
        return "I can assist you with appointment scheduling and reminders. I can help you track upcoming appointments, set reminder notifications, and even integrate with your calendar. Would you like me to set up reminders for existing appointments or help you organize your healthcare schedule?";
      }
      return "I'm your appointment and medication management assistant. I can help you set up reminders for medications, schedule follow-up appointments, and ensure you stay on track with your healthcare routine. What would you like me to help you organize today?";
    }
    
    if (agentType === 'community-agent') {
      return `I've searched recent health research and community insights related to your question about "${message.substring(0, 50)}...". Based on current evidence from reputable medical sources, here are some key findings and recommendations from the health community. I can also help you find specific research studies or connect you with relevant health resources.`;
    }
    
    if (agentType === 'document-agent') {
      return "I'm ready to help analyze your medical documents. I can explain medical terminology, interpret lab results, break down complex medical language, and help you understand what your healthcare documents mean. Please upload your document, and I'll provide a clear, easy-to-understand explanation while reminding you to discuss the results with your healthcare provider.";
    }

    return "I'm here to help with your health-related questions. How can I assist you today?";
  }

  /**
   * Generate mock citations
   */
  private generateMockCitations(agentType: AgentType): string[] {
    const citations: Record<Exclude<AgentType, 'auto'>, string[]> = {
      'health-assistant': [
        'CDC Health Guidelines - General Health Information',
        'Mayo Clinic - Symptom Checker',
        'WHO Health Recommendations',
      ],
      'community-agent': [
        'PubMed - Recent Research Studies',
        'Harvard Health Publishing - Health Articles',
        'NIH National Institute of Health - Research Papers',
      ],
      'document-agent': [
        'Medical Terminology Reference',
        'Lab Values Interpretation Guide',
        'Clinical Practice Guidelines',
      ],
      'appointment-agent': [
        'Medication Adherence Best Practices',
        'Preventive Care Scheduling Guidelines',
        'Healthcare Appointment Management Systems',
      ],
    };

    const effectiveAgentType = agentType === 'auto' ? 'health-assistant' : agentType;
    return citations[effectiveAgentType];
  }

  /**
   * Get authentication token for API calls
   */
  private async getAuthToken(): Promise<string> {
    // This will integrate with your existing AWS Amplify auth
    try {
      const { getCurrentUser } = await import('aws-amplify/auth');
      const session = await getCurrentUser();
      return session.signInDetails?.authFlowType || '';
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Authentication required');
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId: string, userId?: string): Promise<ChatMessage[]> {
    // Return empty history for guest users
    if (userId === 'guest') {
      console.log('📚 getConversationHistory: Returning empty array for guest user');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/conversations/${sessionId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const aiChatService = new AIChatService();
