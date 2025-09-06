/**
 * Debug API Route: Test S3 Configuration
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return environment configuration for debugging
    const config = {
      nodeEnv: process.env.NODE_ENV,
      region: process.env.AWS_REGION,
      bucketName: process.env.NODE_ENV === 'production' 
        ? process.env.S3_DOCUMENTS_BUCKET_PROD
        : process.env.AWS_S3_BUCKET_NAME || process.env.S3_DOCUMENTS_BUCKET_DEV || 'enabl-user-uploads-dev',
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    };

    return NextResponse.json({ config }, { status: 200 });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
