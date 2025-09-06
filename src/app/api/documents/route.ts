/**
 * Documents API - DynamoDB Integration
 * 
 * Replaces local storage with DynamoDB for document metadata storage.
 * Maintains compatibility with existing frontend components.
 */

import { NextRequest, NextResponse } from 'next/server';
import { documentStorage, DocumentRecord } from '@/services/documentStorage';

/**
 * GET /api/documents - Get all documents for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get user ID from query params (sent by frontend)
    const userId = searchParams.get('userId') || 'guest-user';

    // Get all documents for the user
    let documents = await documentStorage.getUserDocuments(userId);
    
    // Apply category filter
    if (category && category !== 'all') {
      documents = documents.filter(doc => 
        doc.analysisResult?.healthcareTags?.includes(category)
      );
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      documents = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchLower) ||
        doc.analysisResult?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedDocuments = documents.slice(startIndex, startIndex + limit);
    
    console.log(`Retrieved ${paginatedDocuments.length} documents from ${documents.length} total for user ${userId}`);

    return NextResponse.json({
      success: true,
      documents: paginatedDocuments,
      pagination: {
        page,
        limit,
        total: documents.length,
        totalPages: Math.ceil(documents.length / limit)
      }
    });

  } catch (error) {
    console.error('Error getting documents:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents - Save a new document (called after S3 upload)
 */
export async function POST(request: NextRequest) {
  try {
    const { document, s3Url, s3Key } = await request.json();

    console.log('📄 Received document data:', {
      documentId: document.id,
      name: document.name,
      hasAiAnalysis: !!document.aiAnalysis,
      smartTagsCount: document.smartTags?.length || 0,
      owner: document.owner
    });

    // Validate required fields
    if (!document || !s3Url || !s3Key) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: document, s3Url, s3Key' 
        },
        { status: 400 }
      );
    }

    // Get user ID from document owner data
    const userId = document.owner?.id || 'guest-user';

    // Create document record
    const documentRecord: Omit<DocumentRecord, 'createdAt' | 'updatedAt'> = {
      userId,
      documentId: document.id || crypto.randomUUID(),
      name: document.name,
      size: document.size || 0,
      type: document.type || 'application/pdf',
      uploadDate: new Date().toISOString(),
      s3Key,
      s3Url,
      analysisResult: document.aiAnalysis ? {
        documentTypeDetection: {
          detectedType: document.aiAnalysis.category || 'informational',
          confidence: document.aiAnalysis.confidence || 0.5,
          reasoning: document.aiAnalysis.summary || 'Default classification'
        },
        medicalRecordPercentage: Math.round((document.aiAnalysis.confidence || 0.5) * 100),
        requiresSignature: document.smartTags?.some((tag: any) => tag.name?.includes('Signature')) || false,
        fields: document.aiAnalysis.extractedData ? Object.entries(document.aiAnalysis.extractedData).map(([name, value]) => ({
          name,
          type: 'text',
          required: false,
          value: String(value)
        })) : [],
        tags: document.smartTags?.map((tag: any) => tag.name) || [],
        healthcareTags: document.smartTags?.filter((tag: any) => tag.type === 'auto').map((tag: any) => tag.name) || [],
      } : {
        documentTypeDetection: {
          detectedType: 'informational',
          confidence: 0.5,
          reasoning: 'No analysis data available'
        },
        medicalRecordPercentage: 0,
        requiresSignature: false,
        fields: [],
        tags: [],
        healthcareTags: [],
      },
    };

    const savedDocument = await documentStorage.saveDocument(documentRecord);
    
    console.log(`Document ${savedDocument.documentId} saved for user ${userId}`);

    return NextResponse.json({
      success: true,
      document: {
        ...savedDocument,
        id: savedDocument.documentId, // For compatibility with frontend
        savedAt: savedDocument.createdAt,
        version: 1,
        owner: { id: userId },
        aiAnalysis: savedDocument.analysisResult,
      },
    });

  } catch (error) {
    console.error('Error saving document:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents - Clear all documents for testing
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'guest-user';

    await documentStorage.clearUserDocuments(userId);
    
    console.log(`Cleared all documents for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'All documents cleared',
    });

  } catch (error) {
    console.error('Error clearing documents:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
