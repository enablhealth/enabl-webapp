/**
 * Document Debug API - Test signed URL generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client with default credential provider chain
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  // Will automatically use AWS credentials from environment, shared credentials file, or IAM role
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId') || 'test-doc';
    const userId = searchParams.get('userId') || 'test-user';
    
    // Test S3 configuration
    const s3Bucket = process.env.S3_DOCUMENTS_BUCKET_DEV || process.env.AWS_S3_BUCKET_NAME || 'enabl-user-uploads-dev';
    const s3Key = `documents/test-document.pdf`;

    console.log('🔧 Debug Info:', {
      hasAWSAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAWSSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.AWS_REGION,
      s3Bucket,
      s3Key,
      documentId,
      userId
    });

    // Test signed URL generation
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    console.log('✅ Test signed URL generated successfully');

    return NextResponse.json({
      success: true,
      debug: {
        hasCredentials: !!process.env.AWS_ACCESS_KEY_ID,
        region: process.env.AWS_REGION,
        bucket: s3Bucket,
        key: s3Key,
        signedUrlLength: signedUrl.length,
        signedUrlPreview: signedUrl.substring(0, 100) + '...',
        fullSignedUrl: signedUrl, // For testing only - don't expose in production
      },
      documentId,
      userId,
      testUrl: signedUrl
    });

  } catch (error) {
    console.error('❌ Debug API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Debug test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          hasCredentials: !!process.env.AWS_ACCESS_KEY_ID,
          region: process.env.AWS_REGION,
          bucket: process.env.S3_DOCUMENTS_BUCKET_DEV || process.env.AWS_S3_BUCKET_NAME,
        }
      },
      { status: 500 }
    );
  }
}
