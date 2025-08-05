export interface User {
  id: string;
  email?: string;
  name?: string;
  isGuest: boolean;
  createdAt: Date;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
