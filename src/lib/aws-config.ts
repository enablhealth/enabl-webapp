/**
 * AWS Amplify Configuration for Enabl Health
 * 
 * This file contains the AWS Cognito configuration for authentication.
 * Environment variables are loaded from .env.local for development
 * and from AWS Systems Manager Parameter Store for production.
 */

import { Amplify } from 'aws-amplify';

// Helper to require critical env vars (avoid accidental prod → dev fallback)
const must = (name: string, allowFallback = false, fallback?: string) => {
  const val = process.env[name];
  if (val && val.trim().length > 0) return val.trim();
  if (allowFallback && fallback) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
};

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || 'development';
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

// Derive canonical app origin per environment (can still be overridden via NEXT_PUBLIC_APP_URL)
const inferredOrigin = (() => {
  switch (APP_ENV) {
    case 'production':
      return 'https://enabl.health';
    case 'staging':
      return 'https://staging.enabl.health';
    case 'development':
    default:
      return 'https://dev.enabl.health';
  }
})();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || inferredOrigin;

// Critical Cognito settings: no silent dev fallback
const COGNITO_USER_POOL_ID = must('NEXT_PUBLIC_COGNITO_USER_POOL_ID');
const COGNITO_USER_POOL_CLIENT_ID = must('NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID');
const COGNITO_DOMAIN = must('NEXT_PUBLIC_COGNITO_DOMAIN');

// Build redirect arrays: always include current origin; in dev also include localhost convenience
const redirectBase = [APP_URL];
if (APP_ENV === 'development') {
  // Allow local testing explicitly
  ['http://localhost:3000', 'http://127.0.0.1:3000'].forEach(u => {
    if (!redirectBase.includes(u)) redirectBase.push(u);
  });
}

// Validation guard: prevent production build from accidentally using a *-dev domain
if (APP_ENV === 'production' && /-dev$/.test(COGNITO_DOMAIN)) {
  // eslint-disable-next-line no-console
  console.error('❌ Production build detected dev Cognito domain. Check env vars.');
  throw new Error('Invalid Cognito domain for production');
}

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: COGNITO_USER_POOL_ID,
      userPoolClientId: COGNITO_USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: `${COGNITO_DOMAIN}.auth.${AWS_REGION}.amazoncognito.com`,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: redirectBase,
          redirectSignOut: redirectBase,
          responseType: 'code' as const
        },
        email: true,
        phone: true,
        username: true
      }
    }
  }
};

/**
 * Configure AWS Amplify with the current environment settings
 */
export const configureAmplify = () => {
  try {
    if (!COGNITO_USER_POOL_ID || !COGNITO_USER_POOL_CLIENT_ID) {
      console.error('❌ Missing Cognito configuration');
      throw new Error('Missing Cognito configuration');
    }
    
    Amplify.configure(awsConfig);
    console.log('✅ AWS Amplify configured successfully');
  } catch (error) {
    console.error('❌ Error configuring AWS Amplify:', error);
    throw error;
  }
};

export default awsConfig;
