import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  ChevronDown,
  Crown,
  FileText,
  Gear,
  HelpCircle,
  Home,
  Logo,
  MessageSquare,
  PenSquare,
  Target,
} from '../components/Icons';
import { useAuth } from '../auth/context';
import './Dashboard.css';

const nav = [
  { to: '/dashboard', label: 'Overview', icon: Home, end: true },
  { to: '/dashboard/analysis', label: 'Resume Analysis', icon: FileText },
  { to: '/dashboard/rewrite', label: 'AI Resume Rewrite', icon: PenSquare },
  { to: '/dashboard/interview', label: 'Interview Preparation', icon: MessageSquare },
  { to: '/dashboard/qa', label: 'Resume Q&A', icon: HelpCircle },
  { to: '/dashboard/job-match', label: 'Job Match', icon: Target },
  { to: '/dashboard/saved', label: 'Saved Resumes', icon: Bookmark },
  { to: '/dashboard/settings', label: 'Settings', icon: Gear },
];

function initials(username: string): string {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : username.slice(0, 2);
  return letters.toUpperCase();
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const username = user?.username ?? '';

  return (
    <div className="dsh">
      <aside className="dsh-side">
        <Link className="dsh-brand" to="/">
          <Logo size={30} />
          <span>CVExpert</span>
        </Link>

        <nav className="dsh-nav">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="dsh-upsell">
          <Crown />
          <strong>Upgrade to Pro</strong>
          <p>Unlock all features and get more interviews.</p>
          <Link className="btn btn-primary" to="/pricing">Upgrade</Link>
        </div>
      </aside>

      <div className="dsh-main">
        <header className="dsh-topbar">
          <button type="button" className="dsh-bell" aria-label="Notifications">
            <Bell />
          </button>

          <div className="dsh-account" ref={menuRef}>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>
              <span className="dsh-avatar">{initials(username)}</span>
              <span className="dsh-whoami">
                <strong>{username}</strong>
                <em>Free Plan</em>
              </span>
              <ChevronDown size={16} />
            </button>

            {menuOpen && (
              <div className="dsh-menu" role="menu">
                <Link to="/dashboard/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
                  Settings
                </Link>
                <Link to="/" role="menuitem" onClick={() => setMenuOpen(false)}>
                  Back to site
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    signOut();
                    navigate('/');
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="dsh-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
