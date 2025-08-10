/**
 * Amplify Provider Component for Enabl Health
 * 
 * This component initializes AWS Amplify configuration on the client side
 * and ensures it's configured before any authentication operations.
 */

'use client';

import { useEffect, useState } from 'react';
import { configureAmplify } from '@/lib/aws-config';

interface AmplifyProviderProps {
  children: React.ReactNode;
}

export function AmplifyProvider({ children }: AmplifyProviderProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAmplify = async () => {
      try {
        // Configure Amplify with server-side configuration (follows Copilot instructions)
        await configureAmplify();
        setIsConfigured(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error';
        setConfigError(errorMessage);
        console.error('❌ Failed to initialize Amplify:', error);
      }
    };

    initializeAmplify();
  }, []);

  // Show error state if configuration failed
  if (configError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-900">
        <div className="text-center p-6">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Configuration Error</h2>
          <p className="text-red-600 dark:text-red-400">{configError}</p>
        </div>
      </div>
    );
  }

  // Show loading state while Amplify is being configured
  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing Enabl Health...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
