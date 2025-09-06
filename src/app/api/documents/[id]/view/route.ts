/**
 * Document View API - Secure document serving with proper authentication
 * 
 * This endpoint:
 * 1. Validates user authentication
 * 2. Checks document permissions
 * 3. Generates signed S3 URLs or proxies content
 * 4. Returns secure document access
 */

import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { documentStorage } from '@/services/documentStorage';

// Initialize S3 client with default credential provider chain
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  // Will automatically use AWS credentials from environment, shared credentials file, or IAM role
});

export async function GET(request: Request) {
  try {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const idMatch = pathname.match(/\/api\/documents\/([^/]+)/);
  const documentId = idMatch ? decodeURIComponent(idMatch[1]) : '';
  const { searchParams } = url;
    const userId = searchParams.get('userId');
    const action = searchParams.get('action') || 'view'; // 'view' or 'download'

    console.log('📄 Document view request:', { documentId, userId, action });

    // Validate required parameters
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required for document access' },
        { status: 401 }
      );
    }

    // Get document from storage
    const document = await documentStorage.getDocument(userId, documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Extract S3 bucket and key from the document
    const s3Bucket = process.env.S3_DOCUMENTS_BUCKET_DEV || process.env.AWS_S3_BUCKET_NAME || 'enabl-user-uploads-dev';
    
        // Try to find S3 key - first by direct paths, then by metadata search
    let validS3Key: string | null = null;
    let keyFound = false;

    const possibleKeys = [
      document.s3Key,
      `${userId}/${document.name}`,
      `documents/${document.name}`,
      document.name,
      `uploads/${userId}/${document.name}`,
      `user-uploads/${userId}/${document.name}`
    ].filter(Boolean);

    console.log('� Trying S3 keys:', possibleKeys);

    // First, try direct key matching
    for (const tryKey of possibleKeys) {
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: s3Bucket,
          Key: tryKey,
        });
        
        await s3Client.send(headCommand);
        validS3Key = tryKey;
        keyFound = true;
        console.log('✅ Found valid S3 key:', validS3Key);
        break;
      } catch (error) {
        console.log(`❌ Key not found: ${tryKey}`);
        continue;
      }
    }

    // If not found by direct keys, search by metadata
    if (!keyFound) {
      console.log('🔍 Searching for file by original filename metadata...');
      try {
        const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
        
        // Search in documents/ folder
        const listCommand = new ListObjectsV2Command({
          Bucket: s3Bucket,
          Prefix: 'documents/',
          MaxKeys: 1000
        });
        
        const listResponse = await s3Client.send(listCommand);
        
        if (listResponse.Contents) {
          for (const object of listResponse.Contents) {
            if (!object.Key) continue;
            
            try {
              // Check metadata for this object
              const headCommand = new HeadObjectCommand({
                Bucket: s3Bucket,
                Key: object.Key,
              });
              
              const headResponse = await s3Client.send(headCommand);
              const originalName = headResponse.Metadata?.['original-name'];
              const ownerId = headResponse.Metadata?.['owner-id'];
              
              // Match by original filename and owner
              if (originalName === document.name && ownerId === userId) {
                validS3Key = object.Key;
                keyFound = true;
                console.log('✅ Found file by metadata search:', {
                  s3Key: validS3Key,
                  originalName,
                  ownerId
                });
                break;
              }
            } catch (headError) {
              // Skip this object if metadata check fails
              continue;
            }
          }
        }
      } catch (listError) {
        console.error('Error searching by metadata:', listError);
      }
    }

    // If no valid S3 key found, return an error
    if (!keyFound) {
      console.error('❌ No valid S3 key found for document:', {
        documentId,
        documentName: document.name,
        triedKeys: possibleKeys
      });
      
      return NextResponse.json(
        { 
          error: 'Document file not found in storage',
          details: `The document "${document.name}" exists in the database but the actual file was not found in S3 storage. This may indicate the file was never uploaded or was deleted.`,
          documentId,
          fileName: document.name,
          suggestedAction: 'Please re-upload the document or contact support if this error persists.'
        },
        { status: 404 }
      );
    }

    // Generate a signed URL for secure access
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: validS3Key!, // We know this is not null because keyFound is true
    });

    // Generate signed URL with 1 hour expiration
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    console.log('✅ Signed URL generated successfully');

    // For PDF files, we can return the signed URL directly for iframe use
    if (document.type === 'application/pdf' && action === 'view') {
      return NextResponse.json({
        success: true,
        signedUrl,
        documentId,
        fileName: document.name,
        fileType: document.type,
        expiresIn: 3600
      });
    }

    // For other files or download action, redirect to signed URL
    if (action === 'download') {
      return NextResponse.redirect(signedUrl);
    }

    // For viewing other file types, return the signed URL
    return NextResponse.json({
      success: true,
      signedUrl,
      documentId,
      fileName: document.name,
      fileType: document.type,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('❌ Error serving document:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to serve document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function HEAD(request: Request) {
  // HEAD request for checking document existence without downloading
  try {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const idMatch = pathname.match(/\/api\/documents\/([^/]+)/);
  const documentId = idMatch ? decodeURIComponent(idMatch[1]) : '';
  const { searchParams } = url;
    const userId = searchParams.get('userId');

    if (!documentId || !userId) {
      return new NextResponse(null, { status: 400 });
    }

    const document = await documentStorage.getDocument(userId, documentId);
    
    if (!document) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Content-Type': document.type,
        'Content-Length': document.size.toString(),
        'X-Document-Name': document.name,
      }
    });

  } catch (error) {
    console.error('❌ Error checking document:', error);
    return new NextResponse(null, { status: 500 });
  }
}
