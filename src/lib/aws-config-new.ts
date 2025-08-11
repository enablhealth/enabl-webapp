/**
 * AWS Amplify Configuration for Enabl Health
 * 
 * Follows Copilot instructions:
 * - "Use process.env in the Next.js app for environment-specific variables"
 * - "Access dynamic configurations via server-side API routes to AWS Secrets Manager"
 * 
 * This ensures ZERO build-time embedding of environment-specific values
 * All configuration is loaded at runtime from server-side API routes
 */

import { Amplify } from 'aws-amplify';

interface AuthConfig {
  userPoolId: string;
  userPoolClientId: string;
  domain: string;
  region: string;
  appEnv: string;
  appUrl: string;
  apiUrl?: string;
  aiApiUrl?: string;
  googleClientId?: string;
  source: string;
  timestamp: string;
}

// Server-side configuration loader (mandatory per Copilot instructions)
const loadConfigFromServer = async (): Promise<AuthConfig | null> => {
  try {
    console.log('🔄 Loading runtime configuration from server API...');
    
    const response = await fetch('/api/config/auth', {
      cache: 'no-store', // Always get fresh runtime config
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Config API error: ${response.status} ${response.statusText}`);
    }
    
    const config = await response.json();
    
    if (config.error) {
      throw new Error(`Server config error: ${config.message}`);
    }
    
    console.log('✅ Runtime configuration loaded successfully:', {
      environment: config.appEnv,
      userPoolId: config.userPoolId,
      domain: config.domain,
      source: config.source,
      timestamp: config.timestamp
    });
    
    return config;
  } catch (error) {
    console.error('❌ Failed to load runtime configuration:', error);
    return null;
  }
};

// Build Amplify configuration from runtime config (follows Copilot domain strategy)
const buildAmplifyConfig = (config: AuthConfig) => {
  // Build redirect arrays: always include current origin; in dev also include localhost convenience
  const redirectBase = [config.appUrl];
  if (config.appEnv === 'development') {
    // Allow local testing explicitly
    ['http://localhost:3000', 'http://127.0.0.1:3000'].forEach(u => {
      if (!redirectBase.includes(u)) redirectBase.push(u);
    });
  }

  // Production validation guard (prevent production build from accidentally using dev domain)
  if (config.appEnv === 'production' && /-dev$/.test(config.domain)) {
    console.error('❌ Production environment detected with dev Cognito domain:', config.domain);
    throw new Error('Invalid Cognito domain for production environment');
  }

  return {
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: {
          oauth: {
            domain: `${config.domain}.auth.${config.region}.amazoncognito.com`,
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
};

/**
 * Configure AWS Amplify with runtime configuration (server-side pattern)
 * This follows the Copilot instructions for dynamic configuration access
 * NO BUILD-TIME VARIABLES ARE USED - Everything is runtime-driven
 */
export const configureAmplify = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing AWS Amplify with runtime configuration...');
    
    // MANDATORY: Load config from server-side API route (per Copilot instructions)
    const serverConfig = await loadConfigFromServer();
    
    if (!serverConfig) {
      throw new Error('Runtime configuration failed: Cannot load server-side config. Check App Runner environment variables.');
    }
    
    // Validate critical configuration
    if (!serverConfig.userPoolId || !serverConfig.userPoolClientId || !serverConfig.domain) {
      throw new Error(`Invalid runtime configuration: Missing critical auth parameters. Source: ${serverConfig.source}`);
    }
    
    // Build Amplify configuration from runtime values
    const amplifyConfig = buildAmplifyConfig(serverConfig);
    
    // Configure Amplify
    Amplify.configure(amplifyConfig);
    
    console.log('✅ AWS Amplify configured successfully with runtime configuration');
    console.log(`📍 Environment: ${serverConfig.appEnv}`);
    console.log(`🔐 User Pool: ${serverConfig.userPoolId}`);
    console.log(`🌐 Domain: ${serverConfig.domain}.auth.${serverConfig.region}.amazoncognito.com`);
    
  } catch (error) {
    console.error('❌ Critical error configuring AWS Amplify:', error);
    throw new Error(`Amplify configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default configureAmplify;
