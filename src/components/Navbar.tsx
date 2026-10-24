import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/context';
import { ChevronDown, Close, Logo, Menu } from './Icons';
import { ThemeToggle } from './ThemeToggle';
import { displayName } from '../lib/identity';
import type { Theme } from '../hooks/useTheme';
import './Navbar.css';

// Section links carry the "/" so they still land on the home page when the
// navbar is rendered on another route, such as /pricing.
const links = [
  { label: 'Product', href: '/#product' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Success Stories', href: '/#stories' },
  { label: 'Resources', href: '/#resources', caret: true },
];

type Props = { theme: Theme; onThemeChange: (t: Theme) => void };

export default function Navbar({ theme, onThemeChange }: Props) {
  const [stuck, setStuck] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  // The menu is open only for the location it was opened on, so any
  // navigation, including a #section jump, closes it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const menuOpen = openAt === location.key;
  const setMenuOpen = (open: boolean) => setOpenAt(open ? location.key : null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenAt(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav ${stuck || menuOpen ? 'is-stuck' : ''}`}>
      <div className="container nav-inner">
        <Link className="nav-brand" to="/">
          <Logo />
          <span>CVExpert</span>
        </Link>

        <nav className="nav-links">
          {links.map((l) => (
            !l.href.startsWith('/#') ? (
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
          <button
            type="button"
            className="nav-burger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="nav-mobile"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <Close /> : <Menu />}
          </button>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          {user ? (
            <>
              <Link className="btn btn-ghost nav-login" to="/dashboard">Dashboard</Link>
              <span className="nav-user" title={`Signed in as ${user.email}`}>
                {displayName(user.email)}
              </span>
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

      {menuOpen && (
        <nav className="nav-mobile" id="nav-mobile">
          <div className="container">
            {links.map((l) => (
              !l.href.startsWith('/#') ? (
                <Link key={l.label} to={l.href}>{l.label}</Link>
              ) : (
                // A same-page hash jump leaves pathname and hash unchanged
                // when it is clicked twice, so close explicitly too.
                <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
              )
            ))}
            {!user && <Link className="nav-mobile-login" to="/login">Login</Link>}
            <div className="nav-mobile-theme">
              <span>Theme</span>
              <ThemeToggle theme={theme} onChange={onThemeChange} />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
