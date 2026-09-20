import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '../lib/api';
import { ApiError, type User } from '../lib/api';
import { AuthContext, type AuthContextValue } from './context';

const TOKEN_KEY = 'cvexpert-token';

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode / blocked storage — the session just won't survive a reload */
  }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<User | null>(null);
  /** The token we have already checked against the server, if any. */
  const [checkedToken, setCheckedToken] = useState<string | null>(null);

  // A token restored from storage is unverified until /me answers: it may have
  // expired, or been signed with a secret the server no longer has.
  const status: 'loading' | 'ready' = !token || checkedToken === token ? 'ready' : 'loading';

  useEffect(() => {
    if (!token || checkedToken === token) return;

    let cancelled = false;
    api
      .me(token)
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch((error) => {
        if (cancelled) return;
        // Only drop the token if the server actually rejected it — a network
        // blip shouldn't sign the user out.
        if (error instanceof ApiError && error.status === 401) {
          writeToken(null);
          setToken(null);
        }
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setCheckedToken(token);
      });

    return () => {
      cancelled = true;
    };
  }, [token, checkedToken]);

  const signIn = useCallback(async (username: string, password: string) => {
    const issued = await api.login(username, password);
    const profile = await api.me(issued.access_token);
    writeToken(issued.access_token);
    setToken(issued.access_token);
    setCheckedToken(issued.access_token);
    setUser(profile);
  }, []);

  const signUp = useCallback(
    async (username: string, password: string) => {
      await api.register(username, password);
      await signIn(username, password);
    },
    [signIn],
  );

  const signOut = useCallback(() => {
    writeToken(null);
    setToken(null);
    setCheckedToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, signIn, signUp, signOut }),
    [user, token, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
