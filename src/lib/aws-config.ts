/**
 * AWS Amplify Configuration for Enabl Health
 * 
 * This file contains the AWS Cognito configuration for authentication.
 * Environment variables are loaded from .env.local for development
 * and from AWS Systems Manager Parameter Store for production.
 */

import { Amplify } from 'aws-amplify';
import type { ResourcesConfig } from 'aws-amplify';

const awsConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || '',
      loginWith: {
        oauth: {
          domain: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}.auth.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}.amazoncognito.com`,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'https://dev.enabl.health',
            'https://staging.enabl.health',
            'https://enabl.health'
          ],
          redirectSignOut: [
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'https://dev.enabl.health',
            'https://staging.enabl.health',
            'https://enabl.health'
          ],
          responseType: 'code' as const
        },
        email: true,
        phone: true,
        username: true
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true
        },
        phone_number: {
          required: false
        },
        given_name: {
          required: true
        },
        family_name: {
          required: true
        }
      },
      allowGuestAccess: true,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true
      }
    }
  }
};

/**
 * Configure AWS Amplify with the current environment settings
 */
export const configureAmplify = () => {
  try {
    // Debug environment variables
    console.log('🔍 Environment variables check:');
    console.log('NEXT_PUBLIC_COGNITO_USER_POOL_ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
    console.log('NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID);
    console.log('NEXT_PUBLIC_COGNITO_DOMAIN:', process.env.NEXT_PUBLIC_COGNITO_DOMAIN);
    console.log('NEXT_PUBLIC_AWS_REGION:', process.env.NEXT_PUBLIC_AWS_REGION);
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    
    // Check if required variables are present
    const requiredVars = [
      'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
      'NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID',
      'NEXT_PUBLIC_AWS_REGION'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    Amplify.configure(awsConfig);
    console.log('✅ AWS Amplify configured successfully');
    console.log('📋 Config summary:', {
      userPoolId: awsConfig.Auth?.Cognito?.userPoolId,
      userPoolClientId: awsConfig.Auth?.Cognito?.userPoolClientId,
      domain: awsConfig.Auth?.Cognito?.loginWith?.oauth?.domain
    });
  } catch (error) {
    console.error('❌ Error configuring AWS Amplify:', error);
    throw error;
  }
};

export default awsConfig;
