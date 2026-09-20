import { Moon, Sun } from './Icons';
import type { Theme } from '../hooks/useTheme';
import './ThemeToggle.css';

type Props = { theme: Theme; onChange: (theme: Theme) => void };

/**
 * Light/dark switch, shared by the marketing navbar and the dashboard topbar.
 *
 * The theme itself lives at the root of the app (see App.tsx) so every
 * surface reads one value — a second copy of the hook would drift.
 */
export function ThemeToggle({ theme, onChange }: Props) {
  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button
        type="button"
        className={theme === 'light' ? 'is-active' : ''}
        onClick={() => onChange('light')}
        aria-label="Light theme"
        aria-pressed={theme === 'light'}
      >
        <Sun />
      </button>
      <button
        type="button"
        className={theme === 'dark' ? 'is-active' : ''}
        onClick={() => onChange('dark')}
        aria-label="Dark theme"
        aria-pressed={theme === 'dark'}
      >
        <Moon />
      </button>
    </div>
  );
}
