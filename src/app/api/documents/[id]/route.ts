/**
 * Individual Document API - DynamoDB Integration
 * 
 * Handles individual document operations (GET, DELETE) with DynamoDB backend.
 */

import { NextResponse } from 'next/server';
import { documentStorage } from '@/services/documentStorage';

/**
 * GET /api/documents/[id] - Get a specific document
 */
export async function GET(request: Request) {
  try {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const idMatch = pathname.match(/\/api\/documents\/([^/]+)/);
  const documentId = idMatch ? decodeURIComponent(idMatch[1]) : '';
  const { searchParams } = url;
    const userId = searchParams.get('userId') || 'guest-user';

    const document = await documentStorage.getDocument(userId, documentId);
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Return document with compatibility format
    return NextResponse.json({
      success: true,
      document: {
        ...document,
        id: document.documentId, // For frontend compatibility
        savedAt: document.createdAt,
        version: 1,
        owner: { id: document.userId },
        aiAnalysis: document.analysisResult,
      }
    });

  } catch (error) {
    console.error('Error getting document:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id] - Delete a specific document
 */
export async function DELETE(request: Request) {
  try {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const idMatch = pathname.match(/\/api\/documents\/([^/]+)/);
  const documentId = idMatch ? decodeURIComponent(idMatch[1]) : '';
  const { searchParams } = url;
    const userId = searchParams.get('userId') || 'guest-user';
    
    console.log(`Attempting to delete document: ${documentId} for user: ${userId}`);

    // Check if document exists first
    const existingDocument = await documentStorage.getDocument(userId, documentId);
    if (!existingDocument) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from both S3 and DynamoDB
    await documentStorage.deleteDocument(userId, documentId);
    
    console.log(`Successfully deleted document: ${existingDocument.name} (ID: ${documentId})`);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletedDocument: {
        id: existingDocument.documentId,
        name: existingDocument.name
      }
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
