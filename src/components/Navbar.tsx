import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/context';
import { ChevronDown, Logo, Moon, Sun } from './Icons';
import type { Theme } from '../hooks/useTheme';
import './Navbar.css';

const links = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Success Stories', href: '#stories' },
  { label: 'Resources', href: '#resources', caret: true },
];

type Props = { theme: Theme; onThemeChange: (t: Theme) => void };

export default function Navbar({ theme, onThemeChange }: Props) {
  const [stuck, setStuck] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav ${stuck ? 'is-stuck' : ''}`}>
      <div className="container nav-inner">
        <Link className="nav-brand" to="/">
          <Logo />
          <span>CVExpert</span>
        </Link>

        <nav className="nav-links">
          {links.map((l) => (
            l.href.startsWith('/') ? (
              <Link key={l.label} to={l.href}>
                {l.label}
                {l.caret && <ChevronDown size={14} />}
              </Link>
            ) : (
              <a key={l.label} href={l.href}>
                {l.label}
                {l.caret && <ChevronDown size={14} />}
              </a>
            )
          ))}
        </nav>

        <div className="nav-actions">
          <div className="theme-toggle" role="group" aria-label="Color theme">
            <button
              type="button"
              className={theme === 'light' ? 'is-active' : ''}
              onClick={() => onThemeChange('light')}
              aria-label="Light theme"
              aria-pressed={theme === 'light'}
            >
              <Sun />
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'is-active' : ''}
              onClick={() => onThemeChange('dark')}
              aria-label="Dark theme"
              aria-pressed={theme === 'dark'}
            >
              <Moon />
            </button>
          </div>
          {user ? (
            <>
              <Link className="btn btn-ghost nav-login" to="/dashboard">Dashboard</Link>
              <span className="nav-user" title={`Signed in as ${user.username}`}>{user.username}</span>
              <button type="button" className="btn btn-ghost" onClick={signOut}>Log out</button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost nav-login" to="/login">Login</Link>
              <Link className="btn btn-primary" to="/login?tab=signup">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
