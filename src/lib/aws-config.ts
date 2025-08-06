/**
 * AWS Amplify Configuration for Enabl Health
 * 
 * This file contains the AWS Cognito configuration for authentication.
 * Environment variables are loaded from .env.local for development
 * and from AWS Systems Manager Parameter Store for production.
 */

import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || ''
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
      'NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID'
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
      userPoolClientId: awsConfig.Auth?.Cognito?.userPoolClientId
    });
  } catch (error) {
    console.error('❌ Error configuring AWS Amplify:', error);
    throw error;
  }
};

export default awsConfig;
