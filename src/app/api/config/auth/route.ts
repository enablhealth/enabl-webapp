/**
 * Server-side API route to provide authentication configuration
 * Follows Copilot instructions: "Access dynamic configurations via server-side API routes to AWS Secrets Manager"
 * Uses runtime environment variables (not build-time) for true environment isolation
 */

import { NextResponse } from 'next/server';

// Helper to enforce required environment variables at runtime
const requireEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
};

// Environment detection based on runtime variables (not build-time)
const getEnvironmentType = (): string => {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development';
  
  // Additional environment detection based on Cognito domain
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  if (cognitoDomain) {
    if (cognitoDomain.includes('-dev')) return 'development';
    if (cognitoDomain.includes('-staging')) return 'staging';
    if (cognitoDomain === 'enabl-auth') return 'production';
  }
   
  return appEnv;
};

// Infer app URL based on environment (static, with sensible defaults)
const inferAppUrl = (env: string): string => {
  const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL;
  if (isLocalDev) return 'http://localhost:3000';

  switch (env) {
    case 'production':
      return 'https://enabl.health';
    case 'staging':
      return 'https://staging.enabl.health';
    case 'development':
    default:
      return 'https://dev.enabl.health';
  }
};

export async function GET() {
  try {
    // Detect environment from runtime variables
    const environment = getEnvironmentType();
    
    // Load configuration from runtime environment variables
    const config = {
      userPoolId: requireEnvVar('NEXT_PUBLIC_COGNITO_USER_POOL_ID'),
      userPoolClientId: requireEnvVar('NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID'),
    domain: requireEnvVar('NEXT_PUBLIC_COGNITO_DOMAIN'),
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      appEnv: environment,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || inferAppUrl(environment),
      
      // Additional configuration
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      aiApiUrl: process.env.NEXT_PUBLIC_AI_API_URL,
      googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    };

    // Production environment validation (prevent dev credentials in prod)
    if (environment === 'production') {
    if (config.domain.includes('-dev')) {
        throw new Error('Production environment detected with dev Cognito domain');
      }
      if (config.userPoolId.includes('lBBFpwOnU')) {
        throw new Error('Production environment detected with dev user pool ID');
      }
    }

    // Log configuration summary (without sensitive data)
    console.log(`📋 Runtime config loaded for environment: ${environment}`, {
      userPoolId: config.userPoolId,
      domain: config.domain,
      appUrl: config.appUrl,
      hasGoogleClientId: !!config.googleClientId
    });

    return NextResponse.json({
      ...config,
      timestamp: new Date().toISOString(),
      source: 'runtime-environment-variables'
    });
    
  } catch (error) {
    console.error('❌ Runtime configuration error:', error);
    
    return NextResponse.json(
      { 
        error: 'Runtime configuration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        source: 'error'
      },
      { status: 500 }
    );
  }
}
