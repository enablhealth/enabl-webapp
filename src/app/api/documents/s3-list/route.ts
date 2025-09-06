/**
 * S3 Debug API - List objects in bucket to debug key issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Initialize S3 client with default credential provider chain
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    const maxKeys = parseInt(searchParams.get('maxKeys') || '20');
    
    const s3Bucket = process.env.S3_DOCUMENTS_BUCKET_DEV || process.env.AWS_S3_BUCKET_NAME || 'enabl-user-uploads-dev';
    
    console.log('🔍 Listing S3 objects:', { s3Bucket, prefix, maxKeys });

    const command = new ListObjectsV2Command({
      Bucket: s3Bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const result = await s3Client.send(command);
    
    const objects = result.Contents?.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
    })) || [];

    return NextResponse.json({
      success: true,
      bucket: s3Bucket,
      prefix,
      totalObjects: result.KeyCount || 0,
      isTruncated: result.IsTruncated || false,
      objects,
    });

  } catch (error) {
    console.error('❌ S3 List Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to list S3 objects',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
