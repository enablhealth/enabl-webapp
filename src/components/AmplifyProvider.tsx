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

  useEffect(() => {
    // Configure Amplify on client side only
    configureAmplify();
    setIsConfigured(true);
  }, []);

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
