import { AuthUser } from 'aws-amplify/auth';

// Re-export AuthUser from Amplify for consistency
export type User = AuthUser;

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
