/**
 * API Route: Generate S3 Presigned URLs
 * 
 * Provides secure presigned URLs for direct client-side uploads to S3
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  // Credentials will be automatically picked up from environment variables,
  // AWS profile, or IAM role when deployed
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
});

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, fileSize, folder = 'documents', userId, userName, userEmail } = await request.json();

    // Validate input
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileType, fileSize' },
        { status: 400 }
      );
    }

    // Validate user information for ownership tracking
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required for file upload' },
        { status: 401 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit. Size: ${(fileSize / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
      'application/json'
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `File type not supported: ${fileType}` },
        { status: 400 }
      );
    }

    // Generate unique file name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split('.').pop();
    const uniqueFileName = `${timestamp}-${randomString}.${extension}`;

    // Get environment-specific bucket
    const bucketName = process.env.NODE_ENV === 'production' 
      ? process.env.S3_DOCUMENTS_BUCKET_PROD
      : process.env.AWS_S3_BUCKET_NAME || process.env.S3_DOCUMENTS_BUCKET_DEV || 'enabl-user-uploads-dev';

    // S3 key with folder structure
    const s3Key = `${folder}/${uniqueFileName}`;

    // Create presigned URL for upload with owner metadata
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        'original-name': fileName,
        'upload-timestamp': timestamp.toString(),
        'owner-id': userId,
        'owner-name': userName || 'Unknown',
        'owner-email': userEmail || 'unknown@example.com',
        'permissions': JSON.stringify({
          canView: [userId],
          canEdit: [userId],
          canShare: [userId],
          isPublic: 'false'
        })
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    // Generate file URL for access
    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      fileName: uniqueFileName,
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}
