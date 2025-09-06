/**
 * API Route: Save Edited PDF
 * 
 * Handles saving edited PDF documents back to S3 and updating metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { documentStorage } from '@/services/documentStorage';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const formData = await request.formData();
    
    const userId = formData.get('userId') as string;
    const editedPdfFile = formData.get('editedPdf') as File;
    const editActions = formData.get('editActions') as string;

    console.log('📝 Saving edited PDF:', {
      documentId,
      userId,
      fileSize: editedPdfFile?.size,
      hasEditActions: !!editActions
    });

    if (!userId || !editedPdfFile || !documentId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, editedPdf, documentId' },
        { status: 400 }
      );
    }

    // Get the original document
    const originalDocument = await documentStorage.getDocument(userId, documentId);
    if (!originalDocument) {
      return NextResponse.json(
        { error: 'Original document not found' },
        { status: 404 }
      );
    }

    // Generate new S3 key for the edited version
    const timestamp = Date.now();
    const s3Bucket = process.env.S3_DOCUMENTS_BUCKET_DEV || process.env.AWS_S3_BUCKET_NAME || 'enabl-user-uploads-dev';
    const fileExtension = originalDocument.name.split('.').pop() || 'pdf';
    const newS3Key = `documents/${timestamp}-edited-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

    // Upload edited PDF to S3
    const pdfBuffer = await editedPdfFile.arrayBuffer();
    
    const uploadCommand = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: newS3Key,
      Body: new Uint8Array(pdfBuffer),
      ContentType: 'application/pdf',
      Metadata: {
        'original-name': originalDocument.name,
        'upload-timestamp': timestamp.toString(),
        'owner-id': userId,
        'is-edited-version': 'true',
        'original-document-id': documentId,
        'edit-actions': editActions || '[]',
        'editor-version': '1.0'
      },
    });

    await s3Client.send(uploadCommand);

    const newS3Url = `https://${s3Bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${newS3Key}`;

    // Update document record with new S3 information
    const updatedDocument = {
      ...originalDocument,
      s3Key: newS3Key,
      s3Url: newS3Url,
      size: editedPdfFile.size,
      uploadDate: new Date().toISOString(),
      // Ensure analysisResult exists and add edit history
      analysisResult: {
        documentTypeDetection: originalDocument.analysisResult?.documentTypeDetection || {
          detectedType: 'edited-document',
          confidence: 1.0,
          reasoning: 'User-edited document'
        },
        medicalRecordPercentage: originalDocument.analysisResult?.medicalRecordPercentage || 0,
        requiresSignature: originalDocument.analysisResult?.requiresSignature || false,
        fields: originalDocument.analysisResult?.fields || [],
        tags: originalDocument.analysisResult?.tags || [],
        healthcareTags: originalDocument.analysisResult?.healthcareTags || [],
        editHistory: [
          ...(originalDocument.analysisResult?.editHistory || []),
          {
            timestamp: new Date().toISOString(),
            userId,
            actionsCount: editActions ? JSON.parse(editActions).length : 0,
            s3Key: newS3Key
          }
        ]
      }
    };

    // Save updated document to database
    await documentStorage.saveDocument(updatedDocument);

    console.log('✅ Edited PDF saved successfully:', {
      newS3Key,
      fileSize: editedPdfFile.size,
      documentId
    });

    return NextResponse.json({
      success: true,
      message: 'PDF edited and saved successfully',
      document: {
        documentId,
        name: originalDocument.name,
        s3Key: newS3Key,
        s3Url: newS3Url,
        size: editedPdfFile.size,
        editedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error saving edited PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save edited PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
