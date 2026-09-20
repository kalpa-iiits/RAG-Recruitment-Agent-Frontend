import { createContext, useContext } from 'react';
import type { User } from '../lib/api';

export type AuthContextValue = {
  user: User | null;
  token: string | null;
  /** 'loading' while a stored token is being validated on first paint. */
  status: 'loading' | 'ready';
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
