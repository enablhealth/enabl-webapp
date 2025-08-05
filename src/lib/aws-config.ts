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
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
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
          responseType: 'code'
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
    Amplify.configure(awsConfig);
    console.log('✅ AWS Amplify configured successfully');
  } catch (error) {
    console.error('❌ Error configuring AWS Amplify:', error);
  }
};

export default awsConfig;
