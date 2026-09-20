import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from './Icons';
import { useAuth } from '../auth/context';
import * as api from '../lib/api';
import { ApiError } from '../lib/api';

type Props = {
  icon: ReactNode;
  title: string;
  body: ReactNode;
  /**
   * The saved resume to reconnect, when there is an analysis on file but the
   * session no longer holds the agent this page needs. Null means there is
   * genuinely nothing analysed yet.
   */
  resumeId: number | null;
  /** Called once the session is live again, so the page can reload itself. */
  onReconnected: () => void;
};

/**
 * What a page shows instead of itself when it has no live analysis to work
 * from.
 *
 * Two different situations wear the same card. Either nothing has been
 * analysed — in which case the only way on is to upload — or something has,
 * and the session simply lost the agent behind it (a backend restart, an
 * idle hour). The second used to look identical to the first and sent
 * people off to upload the same resume again; here it offers to pick the
 * stored analysis back up instead.
 */
export function AnalysisGate({ icon, title, body, resumeId, onReconnected }: Props) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconnect = async () => {
    if (!token || resumeId === null) return;
    setBusy(true);
    setError(null);
    try {
      await api.activateResume(token, resumeId);
      onReconnected();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Could not reopen that analysis.',
      );
      setBusy(false);
    }
  };

  const stale = resumeId !== null;

  return (
    <section className="card rw-empty">
      <span className="rw-empty-icon">{icon}</span>
      <h2>{stale ? 'Pick up where you left off' : title}</h2>
      <p>
        {stale
          ? 'Your last analysis is saved — this page just needs it loaded back in. Nothing is re-scored.'
          : body}
      </p>

      {error && <p className="form-alert" role="alert">{error}</p>}

      {stale ? (
        <>
          <button type="button" className="btn btn-primary" onClick={reconnect} disabled={busy}>
            {busy ? 'Reopening…' : 'Reopen last analysis'}
          </button>
          <Link className="ra-link" to="/dashboard/analysis">
            Or analyze a new resume
          </Link>
        </>
      ) : (
        <Link className="btn btn-primary" to="/dashboard/analysis">
          Go to Resume Analysis <ArrowRight />
        </Link>
      )}
    </section>
  );
}
