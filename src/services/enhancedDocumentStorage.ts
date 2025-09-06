/**
 * Enhanced Document Storage Service - Full Content + Health Intelligence
 * 
 * This service extends the current DynamoDB implementation to store:
 * - Full document text content
 * - Medical entity extraction
 * - Health timeline events
 * - Personalized health insights
 * - Semantic embeddings for RAG
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  DeleteCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { ComprehendMedicalClient, DetectEntitiesV2Command } from '@aws-sdk/client-comprehendmedical';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// AWS Clients
const dynamoClient = new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

const comprehendMedical = new ComprehendMedicalClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment-specific table and bucket names
const DOCUMENTS_TABLE = process.env.DYNAMODB_DOCUMENTS_TABLE || 'enabl-documents-dev';
const USER_HEALTH_PROFILES_TABLE = process.env.DYNAMODB_USER_PROFILES_TABLE || 'enabl-user-health-profiles-dev';
const DOCUMENTS_BUCKET = process.env.S3_DOCUMENTS_BUCKET || 'enabl-user-uploads-dev';

// Enhanced interfaces for full content storage
export interface MedicalEntity {
  entityId: string;
  text: string;
  category: 'MEDICATION' | 'CONDITION' | 'PROCEDURE' | 'ANATOMY' | 'SYMPTOM' | 'TEST_TREATMENT_PROCEDURE';
  confidence: number;
  startOffset: number;
  endOffset: number;
  normalizedForm?: string;
  icd10Code?: string;
  snomedCode?: string;
}

export interface HealthTimelineEvent {
  eventId: string;
  date: string;
  eventType: 'diagnosis' | 'treatment' | 'test' | 'medication' | 'symptom' | 'procedure';
  description: string;
  severity?: 'low' | 'medium' | 'high';
  confidence: number;
  relatedEntities: string[]; // Entity IDs
}

export interface DocumentContentChunk {
  chunkId: string;
  text: string;
  startIndex: number;
  endIndex: number;
  semanticType: 'symptom' | 'diagnosis' | 'treatment' | 'lab' | 'medication' | 'general';
  confidence: number;
  embedding?: number[]; // Vector embedding for semantic search
}

export interface HealthAnalysis {
  isHealthRelated: boolean;
  healthCategories: string[];
  medicalRelevanceScore: number; // 0-1
  clinicalSummary: string;
  actionItems: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
}

// Enhanced Document Record with full content storage
export interface EnhancedDocumentRecord {
  // Existing fields (maintain compatibility)
  userId: string;
  documentId: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  s3Key: string;
  s3Url: string;
  
  // Enhanced content fields
  contentExtracted: boolean;
  extractedText?: string; // Full document text
  contentChunks?: DocumentContentChunk[]; // Chunked content for RAG
  
  // Medical analysis (enhanced from existing analysisResult)
  analysisResult?: {
    documentTypeDetection: {
      detectedType: string;
      confidence: number;
      reasoning: string;
    };
    medicalRecordPercentage: number;
    requiresSignature: boolean;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      value?: string;
    }>;
    tags: string[];
    healthcareTags: string[];
  };
  
  // NEW: Medical Intelligence
  medicalAnalysis?: {
    entities: MedicalEntity[];
    healthAnalysis: HealthAnalysis;
    timelineEvents: HealthTimelineEvent[];
    relatedDocuments: string[]; // Related document IDs
    lastMedicalAnalysis: string;
  };
  
  // NEW: Semantic metadata for RAG
  semanticMetadata?: {
    contentSummary: string;
    keyTopics: string[];
    userRelevanceScore: number; // How relevant to this specific user
    searchKeywords: string[];
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastProcessed?: string; // When content was last processed
}

// User Health Profile for personalized context
export interface UserHealthProfile {
  userId: string;
  healthSummary: {
    conditions: Array<{
      name: string;
      icd10Code?: string;
      diagnosisDate?: string;
      severity: 'mild' | 'moderate' | 'severe';
      status: 'active' | 'resolved' | 'chronic';
    }>;
    medications: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      startDate?: string;
      endDate?: string;
      prescribedFor?: string;
    }>;
    allergies: Array<{
      allergen: string;
      severity: 'mild' | 'moderate' | 'severe';
      reaction?: string;
    }>;
    vitalSigns: Array<{
      type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'height';
      value: string;
      unit: string;
      date: string;
    }>;
  };
  documentInsights: {
    totalDocuments: number;
    categoryCounts: Record<string, number>;
    healthTimeline: HealthTimelineEvent[];
    lastUpdated: string;
  };
  aiPersonalization: {
    preferredCommunicationStyle: 'technical' | 'simple' | 'detailed';
    healthGoals: string[];
    primaryConcerns: string[];
    languagePreference: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Enhanced Document Storage Service with Full Health Intelligence
 */
export class EnhancedDocumentStorageService {
  
  /**
   * Save document with full content extraction and medical analysis
   */
  async saveEnhancedDocument(
    document: Omit<EnhancedDocumentRecord, 'createdAt' | 'updatedAt' | 'contentExtracted' | 'lastProcessed'>
  ): Promise<EnhancedDocumentRecord> {
    const now = new Date().toISOString();
    
    // Start with basic document record
    const documentRecord: EnhancedDocumentRecord = {
      ...document,
      contentExtracted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Save initial document record
    await this.saveDocumentRecord(documentRecord);
    
    // Process content asynchronously
    this.processDocumentContent(documentRecord.documentId, documentRecord.s3Key, documentRecord.userId)
      .catch(error => console.error('Error processing document content:', error));
    
    return documentRecord;
  }

  /**
   * Extract text content from S3 document
   */
  private async extractTextFromS3(s3Key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: DOCUMENTS_BUCKET,
        Key: s3Key
      });
      
      const response = await s3Client.send(command);
      const bodyBytes = await response.Body?.transformToByteArray();
      
      if (!bodyBytes) {
        throw new Error('No content found in S3 object');
      }
      
      // For PDFs, you'd use a PDF parser here
      // For now, assuming text files or using a service like Textract
      const textContent = new TextDecoder().decode(bodyBytes);
      
      return textContent;
    } catch (error) {
      console.error('Error extracting text from S3:', error);
      throw error;
    }
  }

  /**
   * Process document content with medical analysis
   */
  private async processDocumentContent(documentId: string, s3Key: string, userId: string): Promise<void> {
    try {
      console.log(`Processing content for document ${documentId}`);
      
      // 1. Extract text content
      const extractedText = await this.extractTextFromS3(s3Key);
      
      // 2. Extract medical entities
      const medicalEntities = await this.extractMedicalEntities(extractedText);
      
      // 3. Generate health analysis
      const healthAnalysis = await this.generateHealthAnalysis(extractedText, medicalEntities);
      
      // 4. Extract timeline events
      const timelineEvents = await this.extractTimelineEvents(extractedText, medicalEntities);
      
      // 5. Generate content chunks for RAG
      const contentChunks = await this.generateContentChunks(extractedText);
      
      // 6. Generate semantic metadata
      const semanticMetadata = await this.generateSemanticMetadata(extractedText, userId);
      
      // 7. Update document with processed content
      await this.updateDocumentWithContent(documentId, {
        extractedText,
        contentChunks,
        medicalAnalysis: {
          entities: medicalEntities,
          healthAnalysis,
          timelineEvents,
          relatedDocuments: [], // TODO: Implement document similarity
          lastMedicalAnalysis: new Date().toISOString()
        },
        semanticMetadata,
        contentExtracted: true,
        lastProcessed: new Date().toISOString()
      });
      
      // 8. Update user health profile
      await this.updateUserHealthProfile(userId, medicalEntities, timelineEvents, healthAnalysis);
      
      console.log(`Successfully processed content for document ${documentId}`);
      
    } catch (error) {
      console.error(`Error processing document content for ${documentId}:`, error);
      
      // Mark as failed processing
      await this.updateDocumentWithContent(documentId, {
        contentExtracted: false,
        lastProcessed: new Date().toISOString()
      });
    }
  }

  /**
   * Extract medical entities using AWS Comprehend Medical
   */
  private async extractMedicalEntities(text: string): Promise<MedicalEntity[]> {
    try {
      const command = new DetectEntitiesV2Command({
        Text: text.substring(0, 20000) // Comprehend Medical limit
      });
      
      const result = await comprehendMedical.send(command);
      
      return result.Entities?.map(entity => ({
        entityId: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: entity.Text || '',
        category: entity.Category as any,
        confidence: entity.Score || 0,
        startOffset: entity.BeginOffset || 0,
        endOffset: entity.EndOffset || 0,
        // DetectEntitiesV2 does not return ICD10/SNOMED concepts directly
        icd10Code: undefined,
        snomedCode: undefined
      })) || [];
      
    } catch (error) {
      console.error('Error extracting medical entities:', error);
      return [];
    }
  }

  /**
   * Generate health analysis using Bedrock
   */
  private async generateHealthAnalysis(text: string, entities: MedicalEntity[]): Promise<HealthAnalysis> {
    try {
      const prompt = `
        Analyze this medical document and provide a health analysis:
        
        Document Text: ${text.substring(0, 4000)}
        
        Extracted Medical Entities: ${entities.map(e => `${e.text} (${e.category})`).join(', ')}
        
        Please provide:
        1. Is this health-related? (true/false)
        2. Health categories (array of strings)
        3. Medical relevance score (0-1)
        4. Clinical summary (brief paragraph)
        5. Action items (array of strings)
        6. Urgency level (low/medium/high/urgent)
        
        Respond in JSON format only.
      `;
      
      const command = new InvokeModelCommand({
        modelId: 'amazon.nova-pro-v1:0',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.1
        }),
        contentType: 'application/json'
      });
      
      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return JSON.parse(responseBody.content[0].text);
      
    } catch (error) {
      console.error('Error generating health analysis:', error);
      
      // Return default analysis
      return {
        isHealthRelated: entities.length > 0,
        healthCategories: entities.map(e => e.category.toLowerCase()).filter((v, i, a) => a.indexOf(v) === i),
        medicalRelevanceScore: entities.length > 0 ? 0.7 : 0.1,
        clinicalSummary: 'Document contains medical information that requires professional review.',
        actionItems: ['Review with healthcare provider'],
        urgencyLevel: 'low'
      };
    }
  }

  /**
   * Extract timeline events from document
   */
  private async extractTimelineEvents(text: string, entities: MedicalEntity[]): Promise<HealthTimelineEvent[]> {
    // Implementation for extracting dates and creating timeline events
    // This would use NLP to identify dates and associate them with medical entities
    
    const events: HealthTimelineEvent[] = [];
    
    // Simple implementation - look for date patterns and associate with entities
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})/gi;
    const dates = text.match(dateRegex) || [];
    
    dates.forEach((date, index) => {
      if (entities[index]) {
        events.push({
          eventId: `event-${Date.now()}-${index}`,
          date: new Date(date).toISOString(),
          eventType: this.mapEntityToEventType(entities[index].category),
          description: `${entities[index].text} documented on ${date}`,
          confidence: entities[index].confidence,
          relatedEntities: [entities[index].entityId]
        });
      }
    });
    
    return events;
  }

  /**
   * Generate content chunks for RAG
   */
  private async generateContentChunks(text: string): Promise<DocumentContentChunk[]> {
    const chunks: DocumentContentChunk[] = [];
    const chunkSize = 500; // Character chunks
    const overlap = 50; // Overlap between chunks
    
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunkText = text.substring(i, i + chunkSize);
      
      chunks.push({
        chunkId: `chunk-${Date.now()}-${i}`,
        text: chunkText,
        startIndex: i,
        endIndex: Math.min(i + chunkSize, text.length),
        semanticType: this.classifyChunkType(chunkText),
        confidence: 0.8
        // embedding would be generated here using Bedrock embeddings
      });
    }
    
    return chunks;
  }

  /**
   * Generate semantic metadata for search
   */
  private async generateSemanticMetadata(text: string, userId: string): Promise<any> {
    // Generate summary, keywords, and relevance scoring
    return {
      contentSummary: text.substring(0, 200) + '...',
      keyTopics: this.extractKeyTopics(text),
      userRelevanceScore: 0.8, // Would be calculated based on user health profile
      searchKeywords: this.extractSearchKeywords(text)
    };
  }

  /**
   * Update user health profile with new insights
   */
  private async updateUserHealthProfile(
    userId: string, 
    entities: MedicalEntity[], 
    events: HealthTimelineEvent[],
    analysis: HealthAnalysis
  ): Promise<void> {
    try {
      // Get existing profile or create new one
      let profile = await this.getUserHealthProfile(userId);
      
      if (!profile) {
        profile = this.createNewHealthProfile(userId);
      }
      
      // Update with new medical information
      this.updateProfileWithNewData(profile, entities, events, analysis);
      
      // Save updated profile
      await this.saveUserHealthProfile(profile);
      
    } catch (error) {
      console.error('Error updating user health profile:', error);
    }
  }

  // Helper methods
  private mapEntityToEventType(category: string): HealthTimelineEvent['eventType'] {
    const mapping: Record<string, HealthTimelineEvent['eventType']> = {
      'CONDITION': 'diagnosis',
      'MEDICATION': 'medication',
      'PROCEDURE': 'procedure',
      'TEST_TREATMENT_PROCEDURE': 'test',
      'SYMPTOM': 'symptom'
    };
    
    return mapping[category] || 'diagnosis';
  }

  private classifyChunkType(text: string): DocumentContentChunk['semanticType'] {
    // Simple keyword-based classification
    const keywords = {
      symptom: ['pain', 'fever', 'headache', 'nausea', 'fatigue'],
      diagnosis: ['diagnosed', 'condition', 'disease', 'disorder'],
      treatment: ['treatment', 'therapy', 'medication', 'prescribed'],
      lab: ['test', 'result', 'laboratory', 'blood work'],
      medication: ['mg', 'tablet', 'capsule', 'dose', 'medication']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => lowerText.includes(word))) {
        return type as DocumentContentChunk['semanticType'];
      }
    }
    
    return 'general';
  }

  private extractKeyTopics(text: string): string[] {
    // Simple implementation - extract important medical terms
    const medicalTerms = text.match(/\b[A-Z][a-z]*(?:\s+[A-Z][a-z]*)*\b/g) || [];
    return [...new Set(medicalTerms)].slice(0, 10);
  }

  private extractSearchKeywords(text: string): string[] {
    // Extract meaningful keywords for search
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const frequency = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  // Implement remaining CRUD operations...
  private async saveDocumentRecord(record: EnhancedDocumentRecord): Promise<void> {
    const command = new PutCommand({
      TableName: DOCUMENTS_TABLE,
      Item: record
    });
    
    await docClient.send(command);
  }

  private async updateDocumentWithContent(documentId: string, updates: Partial<EnhancedDocumentRecord>): Promise<void> {
    const updateExpression = Object.keys(updates).map(key => `#${key} = :${key}`).join(', ');
    const expressionAttributeNames = Object.keys(updates).reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});
    const expressionAttributeValues = Object.keys(updates).reduce((acc, key) => ({ ...acc, [`:${key}`]: updates[key as keyof EnhancedDocumentRecord] }), {});

    const command = new UpdateCommand({
      TableName: DOCUMENTS_TABLE,
      Key: { documentId },
      UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ':updatedAt': new Date().toISOString()
      }
    });

    await docClient.send(command);
  }

  private async getUserHealthProfile(userId: string): Promise<UserHealthProfile | null> {
    const command = new GetCommand({
      TableName: USER_HEALTH_PROFILES_TABLE,
      Key: { userId }
    });

    const result = await docClient.send(command);
    return result.Item as UserHealthProfile || null;
  }

  private createNewHealthProfile(userId: string): UserHealthProfile {
    const now = new Date().toISOString();
    
    return {
      userId,
      healthSummary: {
        conditions: [],
        medications: [],
        allergies: [],
        vitalSigns: []
      },
      documentInsights: {
        totalDocuments: 0,
        categoryCounts: {},
        healthTimeline: [],
        lastUpdated: now
      },
      aiPersonalization: {
        preferredCommunicationStyle: 'simple',
        healthGoals: [],
        primaryConcerns: [],
        languagePreference: 'en'
      },
      createdAt: now,
      updatedAt: now
    };
  }

  private updateProfileWithNewData(
    profile: UserHealthProfile, 
    entities: MedicalEntity[], 
    events: HealthTimelineEvent[],
    analysis: HealthAnalysis
  ): void {
    // Add new conditions
    entities.filter(e => e.category === 'CONDITION').forEach(condition => {
      const exists = profile.healthSummary.conditions.some(c => 
        c.name.toLowerCase() === condition.text.toLowerCase()
      );
      
      if (!exists) {
        profile.healthSummary.conditions.push({
          name: condition.text,
          icd10Code: condition.icd10Code,
          severity: 'moderate', // Default, could be extracted from text
          status: 'active'
        });
      }
    });

    // Add new medications
    entities.filter(e => e.category === 'MEDICATION').forEach(medication => {
      const exists = profile.healthSummary.medications.some(m => 
        m.name.toLowerCase() === medication.text.toLowerCase()
      );
      
      if (!exists) {
        profile.healthSummary.medications.push({
          name: medication.text
        });
      }
    });

    // Add timeline events
    profile.documentInsights.healthTimeline.push(...events);
    
    // Sort timeline by date
    profile.documentInsights.healthTimeline.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Update document insights
    profile.documentInsights.totalDocuments += 1;
    profile.documentInsights.lastUpdated = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
  }

  private async saveUserHealthProfile(profile: UserHealthProfile): Promise<void> {
    const command = new PutCommand({
      TableName: USER_HEALTH_PROFILES_TABLE,
      Item: profile
    });

    await docClient.send(command);
  }
}

// Export the service
export const enhancedDocumentStorage = new EnhancedDocumentStorageService();
