/**
 * AWS Amplify Configuration for Enabl Health
 * 
 * This file contains the AWS Cognito configuration for authentication.
 * Environment variables are loaded from .env.local for development
 * and from AWS Systems Manager Parameter Store for production.
 */

import { Amplify } from 'aws-amplify';

// Temporary hardcoded values for debugging
const COGNITO_USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_lBBFpwOnU';
const COGNITO_USER_POOL_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || '4rqvopp6dgmre6b18jdmrn7gjc';
const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || 'enabl-auth-dev';
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: COGNITO_USER_POOL_ID,
      userPoolClientId: COGNITO_USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: `${COGNITO_DOMAIN}.auth.${AWS_REGION}.amazoncognito.com`,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [
            APP_URL,
            'https://dev.enabl.health',
            'https://staging.enabl.health',
            'https://enabl.health'
          ],
          redirectSignOut: [
            APP_URL,
            'https://dev.enabl.health',
            'https://staging.enabl.health',
            'https://enabl.health'
          ],
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
