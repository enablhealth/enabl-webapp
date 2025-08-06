/**
 * AI Chat Service for Enabl Health
 * 
 * Handles communication with AI agents (Health Assistant, Community, Document)
 * Includes mock responses for development and real API calls for production
 */

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

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:3001/api';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Send a chat message to the AI agents
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    if (this.isDevelopment) {
      // Use mock responses during development
      return this.getMockResponse(request);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Chat Service error:', error);
      throw new Error('Failed to communicate with AI assistant');
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const agentType = request.agentType || this.inferAgentType(request.message);
    
    return {
      response: this.generateMockResponse(request.message, agentType),
      agentType,
      sessionId: request.sessionId || `mock-${Date.now()}`,
      citations: this.generateMockCitations(agentType),
      timestamp: new Date().toISOString(),
      routedTo: agentType,
      routingDecision: request.agentType ? 'explicit' : 'inferred',
    };
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
    const responses: Record<Exclude<AgentType, 'auto'>, string[]> = {
      'health-assistant': [
        "I understand your health concern. Based on the symptoms you've described, it's important to monitor how you're feeling. If symptoms persist or worsen, I'd recommend consulting with a healthcare professional for proper evaluation.",
        "Thank you for sharing your health question with me. While I can provide general guidance, please remember that I'm not a substitute for professional medical advice. Here's what I can tell you based on current health guidelines...",
        "I'm here to help with your health questions. Based on reliable medical sources, here's some information that might be helpful. However, for personalized medical advice, please consult with your healthcare provider.",
      ],
      'community-agent': [
        "I found some interesting recent research and articles that might be relevant to your question. Here are some evidence-based resources from reputable medical institutions...",
        "Based on current health trends and research, here are some valuable resources and community insights I've curated for you...",
        "I've searched through recent medical literature and trusted health sources. Here's what the latest research suggests about your topic...",
      ],
      'document-agent': [
        "I've analyzed the document you're referring to. Let me explain what these results typically mean in simple terms, while emphasizing that you should discuss these findings with your healthcare provider...",
        "Looking at the information in your document, I can help explain the medical terminology and what these values generally indicate. Remember to review these results with your doctor for proper interpretation...",
        "I can help break down the technical language in your medical document. Here's what these terms and numbers typically mean, though your healthcare provider is the best person to interpret these results in your specific context...",
      ],
      'appointment-agent': [
        "I can help you set up medication reminders and appointment schedules! Let me know when you'd like to be reminded, and I'll make sure you stay on track with your healthcare routine.",
        "Great! I can help you manage your appointments and medication schedule. Would you like me to set up daily reminders for your medications or schedule follow-up appointment notifications?",
        "I'm here to help you stay on top of your health appointments and medication routine. I can set reminders, integrate with your calendar, and send you timely notifications to ensure you never miss important healthcare tasks.",
      ],
    };

    const effectiveAgentType = agentType === 'auto' ? 'health-assistant' : agentType;
    const agentResponses = responses[effectiveAgentType];
    return agentResponses[Math.floor(Math.random() * agentResponses.length)];
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
  async getConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    if (this.isDevelopment) {
      // Return mock conversation history
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/conversations/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
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
}

export const aiChatService = new AIChatService();
