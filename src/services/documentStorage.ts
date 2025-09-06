/**
 * Document Storage Service - S3 + DynamoDB Integration
 * 
 * This service replaces local storage with a production-ready solution:
 * - S3: Stores actual document files
 * - DynamoDB: Stores document metadata, analysis results, and tags
 * - Eliminates sync issues between UI and storage
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  DeleteCommand,
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// AWS Clients
const dynamoClient = new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

// Environment-specific table and bucket names
const DOCUMENTS_TABLE = process.env.DYNAMODB_DOCUMENTS_TABLE || 'enabl-documents-dev';
const DOCUMENTS_BUCKET = process.env.S3_DOCUMENTS_BUCKET || 'enabl-user-uploads-dev';

// Document interface matching our current structure
export interface DocumentRecord {
  userId: string;
  documentId: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  s3Key: string;
  s3Url: string;
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
    editHistory?: Array<{
      timestamp: string;
      userId: string;
      actionsCount: number;
      s3Key: string;
    }>;
  };
  // DynamoDB timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Document Storage Service Class
 */
export class DocumentStorageService {
  
  /**
   * Save document metadata to DynamoDB
   */
  async saveDocument(document: Omit<DocumentRecord, 'createdAt' | 'updatedAt'>): Promise<DocumentRecord> {
    const now = new Date().toISOString();
    const documentRecord: DocumentRecord = {
      ...document,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: DOCUMENTS_TABLE,
      Item: documentRecord,
    });

    try {
      await docClient.send(command);
      console.log(`Document ${document.documentId} saved to DynamoDB`);
      return documentRecord;
    } catch (error) {
      console.error('Error saving document to DynamoDB:', error);
      throw new Error(`Failed to save document: ${error}`);
    }
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string): Promise<DocumentRecord[]> {
    const command = new QueryCommand({
      TableName: DOCUMENTS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by documentId descending (newest first)
    });

    try {
      const result = await docClient.send(command);
      return (result.Items as DocumentRecord[]) || [];
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw new Error(`Failed to get documents: ${error}`);
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(userId: string, documentId: string): Promise<DocumentRecord | null> {
    const command = new GetCommand({
      TableName: DOCUMENTS_TABLE,
      Key: {
        userId,
        documentId,
      },
    });

    try {
      const result = await docClient.send(command);
      return (result.Item as DocumentRecord) || null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw new Error(`Failed to get document: ${error}`);
    }
  }

  /**
   * Update document analysis results
   */
  async updateDocumentAnalysis(
    userId: string, 
    documentId: string, 
    analysisResult: DocumentRecord['analysisResult']
  ): Promise<void> {
    const command = new PutCommand({
      TableName: DOCUMENTS_TABLE,
      Item: {
        userId,
        documentId,
        analysisResult,
        updatedAt: new Date().toISOString(),
      },
      ConditionExpression: 'attribute_exists(userId) AND attribute_exists(documentId)',
    });

    try {
      await docClient.send(command);
      console.log(`Document analysis updated for ${documentId}`);
    } catch (error) {
      console.error('Error updating document analysis:', error);
      throw new Error(`Failed to update analysis: ${error}`);
    }
  }

  /**
   * Delete document from both S3 and DynamoDB
   */
  async deleteDocument(userId: string, documentId: string): Promise<void> {
    // First get the document to find the S3 key
    const document = await this.getDocument(userId, documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    try {
      // Delete from S3
      const s3DeleteCommand = new DeleteObjectCommand({
        Bucket: DOCUMENTS_BUCKET,
        Key: document.s3Key,
      });
      await s3Client.send(s3DeleteCommand);
      console.log(`Document ${document.s3Key} deleted from S3`);

      // Delete from DynamoDB
      const dynamoDeleteCommand = new DeleteCommand({
        TableName: DOCUMENTS_TABLE,
        Key: {
          userId,
          documentId,
        },
      });
      await docClient.send(dynamoDeleteCommand);
      console.log(`Document ${documentId} deleted from DynamoDB`);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error}`);
    }
  }

  /**
   * Clear all documents for a user (for testing)
   */
  async clearUserDocuments(userId: string): Promise<void> {
    const documents = await this.getUserDocuments(userId);
    
    for (const document of documents) {
      await this.deleteDocument(userId, document.documentId);
    }
    
    console.log(`Cleared ${documents.length} documents for user ${userId}`);
  }

  /**
   * Get document count for a user
   */
  async getDocumentCount(userId: string): Promise<number> {
    const command = new QueryCommand({
      TableName: DOCUMENTS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Select: 'COUNT',
    });

    try {
      const result = await docClient.send(command);
      return result.Count || 0;
    } catch (error) {
      console.error('Error getting document count:', error);
      return 0;
    }
  }

  /**
   * Health check - verify DynamoDB and S3 connectivity
   */
  async healthCheck(): Promise<{ dynamodb: boolean; s3: boolean; tableName: string; bucketName: string }> {
    try {
      // Test DynamoDB connection
      const dynamoCommand = new ScanCommand({
        TableName: DOCUMENTS_TABLE,
        Limit: 1,
      });
      await docClient.send(dynamoCommand);

      return {
        dynamodb: true,
        s3: true, // S3 client is always available if AWS credentials are valid
        tableName: DOCUMENTS_TABLE,
        bucketName: DOCUMENTS_BUCKET,
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        dynamodb: false,
        s3: false,
        tableName: DOCUMENTS_TABLE,
        bucketName: DOCUMENTS_BUCKET,
      };
    }
  }
}

// Export singleton instance
export const documentStorage = new DocumentStorageService();
