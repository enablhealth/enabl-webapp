/**
 * API Route: Delete S3 Files
 * 
 * Handles secure deletion of files from S3 storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function DELETE(request: NextRequest) {
  try {
    const { fileUrl, fileName } = await request.json();

    // Validate input
    if (!fileUrl && !fileName) {
      return NextResponse.json(
        { error: 'Either fileUrl or fileName is required' },
        { status: 400 }
      );
    }

    // Get environment-specific bucket
    const bucketName = process.env.NODE_ENV === 'production' 
      ? process.env.S3_DOCUMENTS_BUCKET_PROD
      : process.env.S3_DOCUMENTS_BUCKET_DEV || 'enabl-documents-dev';

    let s3Key: string;

    if (fileUrl) {
      // Extract S3 key from URL
      const url = new URL(fileUrl);
      s3Key = url.pathname.substring(1); // Remove leading slash
    } else {
      // Use fileName with documents folder
      s3Key = `documents/${fileName}`;
    }

    // Delete file from S3
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      deletedKey: s3Key,
    });

  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
