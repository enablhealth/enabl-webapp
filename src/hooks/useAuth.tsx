/**
 * Authentication Hook for Enabl Health
 * 
 * Custom React hook for managing AWS Cognito authentication state
 * and providing authentication methods throughout the application.
 */

'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  signUp, 
  signIn, 
  signOut, 
  confirmSignUp, 
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  type SignUpInput,
  type SignInInput,
  type ConfirmSignUpInput,
  type ResetPasswordInput,
  type ConfirmResetPasswordInput
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { logger } from '../lib/logger';

// Types
export interface AuthUser {
  userId: string;
  username: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  email_verified?: boolean;
  phone_number_verified?: boolean;
  // Compatibility properties for old auth system
  id?: string;
  name?: string;
  isGuest?: boolean;
  avatar?: string;
  createdAt?: Date;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (input: SignUpInput) => Promise<unknown>;
  signIn: (input: SignInInput) => Promise<unknown>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for signOut
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<unknown>;
  resendSignUpCode: (username: string) => Promise<unknown>;
  resetPassword: (input: ResetPasswordInput) => Promise<unknown>;
  confirmResetPassword: (input: ConfirmResetPasswordInput) => Promise<unknown>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<void>; // For profile updates
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Get current user information
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      
      if (currentUser && session.tokens) {
        const userAttributes = currentUser.signInDetails?.loginId ? {
          userId: currentUser.userId,
          username: currentUser.username,
          email: currentUser.signInDetails.loginId,
          // Compatibility properties
          id: currentUser.userId,
          name: currentUser.username,
          isGuest: false,
          avatar: `https://ui-avatars.com/api/?name=${currentUser.username}&background=3b82f6&color=fff`,
          createdAt: new Date(),
        } : {
          userId: currentUser.userId,
          username: currentUser.username,
          // Compatibility properties
          id: currentUser.userId,
          name: currentUser.username,
          isGuest: false,
          avatar: `https://ui-avatars.com/api/?name=${currentUser.username}&background=3b82f6&color=fff`,
          createdAt: new Date(),
        };

        setUser(userAttributes as AuthUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('No authenticated user found:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Hub listener for auth state changes
  useEffect(() => {
    const unsubscribe = Hub.listen('auth', (data) => {
      const { event } = data.payload;
      
      switch (event) {
        case 'signedIn':
          logger.success('✅ User signed in');
          refreshUser();
          break;
        case 'signedOut':
          logger.info('👋 User signed out');
          setUser(null);
          setIsLoading(false);
          break;
        case 'tokenRefresh':
          logger.debug('🔄 Token refreshed');
          refreshUser();
          break;
        case 'tokenRefresh_failure':
          logger.warn('❌ Token refresh failed');
          setUser(null);
          break;
        default:
          break;
      }
    });

    // Initial user check
    refreshUser();

    return unsubscribe;
  }, []);

  // Authentication methods
  const authMethods = {
    signUp: async (input: SignUpInput) => {
      try {
        const result = await signUp(input);
        logger.success('✅ Sign up successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }
    },

    signIn: async (input: SignInInput) => {
      try {
        const result = await signIn(input);
        logger.success('✅ Sign in successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }
    },

    signOut: async () => {
      try {
        await signOut();
        logger.success('✅ Sign out successful');
      } catch (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
    },

    confirmSignUp: async (input: ConfirmSignUpInput) => {
      try {
        const result = await confirmSignUp(input);
        logger.success('✅ Sign up confirmation successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Sign up confirmation error:', error);
        throw error;
      }
    },

    resendSignUpCode: async (username: string) => {
      try {
        const result = await resendSignUpCode({ username });
        logger.success('✅ Resend code successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Resend code error:', error);
        throw error;
      }
    },

    resetPassword: async (input: ResetPasswordInput) => {
      try {
        const result = await resetPassword(input);
        logger.success('✅ Reset password successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Reset password error:', error);
        throw error;
      }
    },

    confirmResetPassword: async (input: ConfirmResetPasswordInput) => {
      try {
        const result = await confirmResetPassword(input);
        logger.success('✅ Confirm reset password successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Confirm reset password error:', error);
        throw error;
      }
    },

    // Compatibility methods for old auth system
    logout: async () => {
      try {
        await signOut();
        setUser(null);
        logger.success('✅ Logout successful');
      } catch (error) {
        console.error('❌ Logout error:', error);
        throw error;
      }
    },

    updateProfile: async (data: Record<string, unknown>) => {
      try {
        // For now, this is a placeholder for profile updates
        // In the future, this would use Cognito's updateUserAttributes
        console.log('📝 Profile update requested:', data);
        console.warn('Profile updates not yet implemented with Cognito');
        return Promise.resolve();
      } catch (error) {
        console.error('❌ Profile update error:', error);
        throw error;
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    refreshUser,
    ...authMethods
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
