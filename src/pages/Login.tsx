import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { GoogleG, Logo } from '../components/Icons';
import MountainArt from '../components/MountainArt';
import { useAuth } from '../auth/context';
import { ApiError } from '../lib/api';
import './Login.css';

type Mode = 'login' | 'signup';

/** Mirrors the constraints in backend/auth.py's UserCreate model. */
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

function validate(mode: Mode, username: string, password: string, confirm: string): string | null {
  if (!username.trim()) return 'Enter your username.';
  if (!password) return 'Enter your password.';
  if (mode === 'login') return null;

  if (username.length < 3 || username.length > 50)
    return 'Username must be between 3 and 50 characters.';
  if (!USERNAME_PATTERN.test(username))
    return 'Username can only contain letters, numbers, and . _ -';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password must be at most 128 characters.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

export default function Login() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { user, status, signIn, signUp } = useAuth();

  const mode: Mode = params.get('tab') === 'signup' ? 'signup' : 'login';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  /**
   * Messages are tagged with the tab they belong to, so switching tabs (or
   * navigating back to one) never shows a stale message from the other form.
   */
  const [message, setMessage] = useState<{ mode: Mode; kind: 'error' | 'notice'; text: string } | null>(
    null,
  );

  const current = message && message.mode === mode ? message : null;
  const error = current?.kind === 'error' ? current.text : null;
  const notice = current?.kind === 'notice' ? current.text : null;

  const setError = (text: string) => setMessage({ mode, kind: 'error', text });
  const setNotice = (text: string) => setMessage({ mode, kind: 'notice', text });

  if (status === 'ready' && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  const setMode = (next: Mode) => {
    setParams(next === 'signup' ? { tab: 'signup' } : {}, { replace: true });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const problem = validate(mode, username, password, confirm);
    if (problem) {
      setError(problem);
      return;
    }

    setMessage(null);
    setSubmitting(true);
    try {
      if (mode === 'login') await signIn(username, password);
      else await signUp(username, password);
      // On success the redirect above takes over once `user` lands.
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setError('That username is already taken. Try signing in instead.');
      } else if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="auth">
      <div className="auth-shell">
        <aside className="auth-brand">
          <MountainArt className="auth-art" />

          <Link className="auth-logo" to="/">
            <Logo size={34} />
            <span>CVExpert</span>
          </Link>

          <div className="auth-pitch">
            <h1>
              Land More
              <br />
              <span className="accent">Interviews.</span> Faster.
            </h1>
            <p>Join 10,000+ professionals who have improved their careers with AI.</p>
          </div>

          <figure className="auth-quote">
            <div>
              <span className="auth-avatar">RS</span>
              <blockquote>
                "CVExpert helped me get 3x more interviews. The AI feedback is incredibly accurate!"
              </blockquote>
            </div>
            <figcaption>
              <strong>Rahul S.</strong>
              <em>Software Engineer at Google</em>
            </figcaption>
          </figure>
        </aside>

        <section className="auth-panel">
          <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-sub">
            {isSignup ? 'Start improving your resume today' : 'Sign in to your account'}
          </p>

          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={!isSignup ? 'is-active' : ''}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={isSignup ? 'is-active' : ''}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <label className="field">
              <span>Username</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <div className="field-row">
                <input
                  type="password"
                  name="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
                {!isSignup && (
                  <button
                    type="button"
                    className="field-link"
                    onClick={() =>
                      setNotice(
                        'Password reset is not available yet — the backend has no reset endpoint. Ask an admin to reset it for you.',
                      )
                    }
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              {isSignup && <small className="field-hint">At least 8 characters.</small>}
            </label>

            {isSignup && (
              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={submitting}
                />
              </label>
            )}

            {error && (
              <p className="auth-alert" role="alert">
                {error}
              </p>
            )}
            {notice && <p className="auth-notice">{notice}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting
                ? isSignup
                  ? 'Creating account…'
                  : 'Signing in…'
                : isSignup
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>Or continue with</span></div>

          <div className="auth-social">
            <button type="button" className="btn btn-ghost" disabled>
              <GoogleG /> Continue with Google
            </button>
          </div>
          <small className="auth-social-note">
            Social sign-in is not configured on the backend yet.
          </small>

          <p className="auth-switch">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button type="button" onClick={() => setMode(isSignup ? 'login' : 'signup')}>
              {isSignup ? 'Login' : 'Sign up'}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}
