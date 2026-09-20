/**
 * A small client-side log of what the user has done, shown on the dashboard.
 * The backend has no activity endpoint, so this is written by the pages that
 * perform actions and read back here.
 */
export type ActivityKind = 'analysis' | 'question' | 'interview' | 'rewrite';

export type ActivityEntry = {
  kind: ActivityKind;
  label: string;
  /** Short trailing badge, e.g. a score. */
  badge?: string;
  /** Epoch milliseconds. */
  at: number;
};

const KEY = 'cvexpert-activity';
const LIMIT = 20;

export function readActivity(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ActivityEntry[];
  } catch {
    return [];
  }
}

export function recordActivity(entry: Omit<ActivityEntry, 'at'>) {
  try {
    const next = [{ ...entry, at: Date.now() }, ...readActivity()].slice(0, LIMIT);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the log is a convenience, not a source of truth */
  }
}

/** "2 hours ago", "1 day ago" — matches the dashboard's activity list. */
export function timeAgo(at: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
