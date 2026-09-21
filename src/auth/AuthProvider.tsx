import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '../lib/api';
import type { User } from '../lib/api';
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
      .catch(() => {
        if (cancelled) return;
        // A rejected token is dropped by the unauthorized handler below; a
        // network blip lands here too, and shouldn't sign the user out.
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setCheckedToken(token);
      });

    return () => {
      cancelled = true;
    };
  }, [token, checkedToken]);

  const clearSession = useCallback(() => {
    writeToken(null);
    setToken(null);
    setCheckedToken(null);
    setUser(null);
  }, []);

  // Any call that comes back 401 means the session is over — drop it here and
  // RequireAuth redirects to /login on the next render, with no reload needed.
  useEffect(() => {
    api.setUnauthorizedHandler(clearSession);
    return () => api.setUnauthorizedHandler(null);
  }, [clearSession]);

  // A tab left open past the token's lifetime makes no requests, so it would
  // keep showing a signed-in shell until something was clicked. Re-check when
  // it comes back to the foreground; a 401 lands in the handler above.
  useEffect(() => {
    if (!token) return;

    const revalidate = () => {
      if (document.visibilityState !== 'visible') return;
      api.me(token).catch(() => {
        /* 401 signs out via the handler; anything else is a blip worth ignoring */
      });
    };

    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [token]);

  const signIn = useCallback(async (email: string, password: string) => {
    const issued = await api.login(email, password);
    const profile = await api.me(issued.access_token);
    writeToken(issued.access_token);
    setToken(issued.access_token);
    setCheckedToken(issued.access_token);
    setUser(profile);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string) => {
      await api.register(email, password);
      await signIn(email, password);
    },
    [signIn],
  );

  const signOut = clearSession;

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, signIn, signUp, signOut }),
    [user, token, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
