import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './context';

/** Gate for pages that need a session; sends guests to /login and back again. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const location = useLocation();

  // Don't bounce to /login while a stored token is still being validated.
  if (status === 'loading') {
    return (
      <div className="route-loading" role="status">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
