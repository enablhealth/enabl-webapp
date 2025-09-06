/**
 * Health Check API for Document Storage
 * 
 * Provides status information about DynamoDB and S3 connectivity
 */

import { NextRequest, NextResponse } from 'next/server';
import { documentStorage } from '@/services/documentStorage';

export async function GET(request: NextRequest) {
  try {
    const healthCheck = await documentStorage.healthCheck();
    
    const status = {
      status: healthCheck.dynamodb && healthCheck.s3 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        dynamodb: {
          status: healthCheck.dynamodb ? 'connected' : 'disconnected',
          tableName: healthCheck.tableName,
        },
        s3: {
          status: healthCheck.s3 ? 'connected' : 'disconnected', 
          bucketName: healthCheck.bucketName,
        }
      },
      environment: {
        region: process.env.AWS_REGION || 'us-east-1',
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE),
      }
    };

    return NextResponse.json(status);

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        dynamodb: { status: 'error' },
        s3: { status: 'error' }
      }
    }, { status: 500 });
  }
}
