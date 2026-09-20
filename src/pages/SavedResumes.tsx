import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart,
  Briefcase,
  Download,
  FileText,
  Sparkles,
  Star,
  Trash,
  Upload,
} from '../components/Icons';
import { useAuth } from '../auth/context';
import * as api from '../lib/api';
import { ApiError, type JobMatch, type SavedResume } from '../lib/api';
import { timeAgo } from '../lib/activity';
import { downloadText } from '../lib/diff';
import './SavedResumes.css';

type Sort = 'modified' | 'score' | 'name';
type Source = 'all' | 'base' | 'tailored';

/**
 * One list, two origins: resumes you analysed, and the company-specific
 * versions generated on the Job Match page.
 */
type Row = {
  key: string;
  kind: 'base' | 'tailored';
  /** Company for a tailored resume, filename for an analysed one. */
  heading: string;
  subheading: string;
  company: string;
  role: string;
  score: number | null;
  good: boolean;
  tags: string[];
  favourite: boolean;
  updatedAt: string;
  base?: SavedResume;
  match?: JobMatch;
};

const SOURCES: { id: Source; label: string }[] = [
  { id: 'all', label: 'All resumes' },
  { id: 'base', label: 'Analysed resumes' },
  { id: 'tailored', label: 'Company-specific' },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: 'modified', label: 'Last Modified' },
  { id: 'score', label: 'ATS Score' },
  { id: 'name', label: 'Name' },
];

function scoreTone(score: number | null): 'good' | 'mid' | 'low' {
  if (score === null) return 'low';
  if (score >= 75) return 'good';
  if (score >= 60) return 'mid';
  return 'low';
}

/** Small ring matching the score dial on the cards. */
function ScoreRing({ score }: { score: number | null }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const filled = ((score ?? 0) / 100) * circumference;
  const tone = scoreTone(score);
  const colour = tone === 'good' ? '#16a34a' : tone === 'mid' ? '#f5a524' : '#ef4444';

  return (
    <div className="sr-ring">
      <svg viewBox="0 0 64 64" role="img" aria-label={`ATS score ${score ?? 0} out of 100`}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={radius} fill="none" stroke={colour} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span>{score ?? '—'}</span>
    </div>
  );
}

export default function SavedResumes() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<SavedResume[]>([]);
  const [tailored, setTailored] = useState<JobMatch[]>([]);
  const [source, setSource] = useState<Source>('all');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sort, setSort] = useState<Sort>('modified');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      api.listResumes(token),
      // Only matches that actually produced a resume belong in this list.
      api.listJobMatches(token).catch(() => []),
    ])
      .then(([rows, matches]) => {
        if (cancelled) return;
        setItems(rows);
        setTailored(matches.filter((m) => m.has_optimized_resume));
        setState('ready');
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Could not load your resumes.');
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (menuId === null) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuId]);

  const rows = useMemo<Row[]>(() => {
    const fromBase: Row[] = items.map((item) => ({
      key: `r-${item.id}`,
      kind: 'base',
      heading: item.filename,
      subheading: item.role || 'No role set',
      company: '',
      role: item.role,
      score: item.overall_score,
      good: item.selected,
      tags: item.tags,
      favourite: item.favourite,
      updatedAt: item.updated_at,
      base: item,
    }));

    const fromMatches: Row[] = tailored.map((match) => ({
      key: `j-${match.id}`,
      kind: 'tailored',
      heading: match.company || 'Company not stated',
      subheading: match.title || 'Role not stated',
      company: match.company,
      role: match.title,
      score: match.optimized_score ?? match.match_score,
      good: (match.optimized_score ?? match.match_score) >= 75,
      tags: match.role_summary.key_skills,
      favourite: false,
      updatedAt: match.updated_at,
      match,
    }));

    return [...fromBase, ...fromMatches];
  }, [items, tailored]);

  const roles = useMemo(
    () => [...new Set(rows.map((row) => row.role).filter(Boolean))].sort(),
    [rows],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (source !== 'all' && row.kind !== source) return false;
      if (roleFilter && row.role !== roleFilter) return false;
      if (!needle) return true;
      return (
        row.heading.toLowerCase().includes(needle) ||
        row.subheading.toLowerCase().includes(needle) ||
        row.company.toLowerCase().includes(needle) ||
        row.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });

    // Favourites stay pinned whichever sort is active.
    return filtered.sort((a, b) => {
      if (a.favourite !== b.favourite) return a.favourite ? -1 : 1;
      if (sort === 'score') return (b.score ?? -1) - (a.score ?? -1);
      if (sort === 'name') return a.heading.localeCompare(b.heading);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [rows, query, roleFilter, sort, source]);

  const toggleFavourite = async (item: SavedResume) => {
    if (!token) return;
    setBusyId(`r-${item.id}`);
    try {
      const updated = await api.updateResume(token, item.id, { favourite: !item.favourite });
      setItems((rows) => rows.map((row) => (row.id === item.id ? updated : row)));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not update that resume.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: SavedResume) => {
    if (!token) return;
    if (!window.confirm(`Delete ${item.filename}? This cannot be undone.`)) return;
    setBusyId(`r-${item.id}`);
    setMenuId(null);
    try {
      await api.deleteResume(token, item.id);
      setItems((rows) => rows.filter((row) => row.id !== item.id));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not delete that resume.');
    } finally {
      setBusyId(null);
    }
  };

  const rename = async (item: SavedResume) => {
    if (!token) return;
    const next = window.prompt('Rename resume', item.filename);
    setMenuId(null);
    if (!next || next.trim() === item.filename) return;
    setBusyId(`r-${item.id}`);
    try {
      const updated = await api.updateResume(token, item.id, { filename: next.trim() });
      setItems((rows) => rows.map((row) => (row.id === item.id ? updated : row)));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not rename that resume.');
    } finally {
      setBusyId(null);
    }
  };

  /** Base resumes download their extracted text; tailored ones the generated text. */
  const download = async (row: Row) => {
    if (!token) return;
    setBusyId(row.key);
    setMenuId(null);
    try {
      if (row.kind === 'tailored' && row.match) {
        const detail = await api.readJobMatch(token, row.match.id);
        if (!detail.optimized_resume) {
          setError('That tailored resume is no longer available.');
          return;
        }
        const label = [row.company, row.role].filter(Boolean).join('-').replace(/\s+/g, '_');
        downloadText(`${label || 'tailored'}-resume.txt`, detail.optimized_resume);
        return;
      }
      const item = row.base!;
      const detail = await api.readResume(token, item.id);
      const name = item.filename.replace(/\.pdf$/i, '') || 'resume';
      downloadText(`${name}.txt`, detail.resume_text);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not download that resume.');
    } finally {
      setBusyId(null);
    }
  };

  const viewAnalysis = async (row: Row) => {
    if (!token) return;
    setError(null);

    // A tailored resume belongs to a job match, so send the user there.
    if (row.kind === 'tailored' && row.match) {
      navigate(`/dashboard/job-match?match=${row.match.id}`);
      return;
    }

    setBusyId(row.key);
    try {
      await api.activateResume(token, row.base!.id);
      navigate('/dashboard/analysis');
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Could not open that analysis.',
      );
      setBusyId(null);
    }
  };

  const head = (
    <header className="sr-head">
      <div>
        <span className="eyebrow">Saved Resumes</span>
        <h1>Your Saved Resumes</h1>
        <p>Manage, analyze, and use your saved resumes for different job applications.</p>
      </div>
      <Link className="btn btn-primary" to="/dashboard/analysis">
        <Upload size={16} /> Upload New Resume
      </Link>
    </header>
  );

  if (state === 'loading') {
    return (
      <>
        {head}
        <div className="card ov-placeholder">Loading your resumes…</div>
      </>
    );
  }

  if (state === 'error') {
    return (
      <>
        {head}
        <div className="card ov-placeholder ov-error">{error}</div>
      </>
    );
  }

  return (
    <>
      {head}

      {items.length > 0 && (
        <div className="sr-toolbar">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resumes…"
            aria-label="Search resumes"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as Source)}
            aria-label="Filter by resume type"
          >
            {SOURCES.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by">
            {SORTS.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="form-alert" role="alert">{error}</p>}

      {items.length === 0 ? (
        <section className="card rw-empty">
          <span className="rw-empty-icon"><FileText size={22} /></span>
          <h2>No saved resumes yet</h2>
          <p>
            Every resume you analyze is saved here automatically, along with the
            company-specific versions you generate on the Job Match page.
          </p>
          <Link className="btn btn-primary" to="/dashboard/analysis">
            Analyze your first resume <ArrowRight />
          </Link>
        </section>
      ) : visible.length === 0 ? (
        <p className="sr-none">No resumes match that search.</p>
      ) : (
        <ul className="sr-list">
          {visible.map((row) => (
            <li className={`card sr-item ${busyId === row.key ? 'is-busy' : ''}`} key={row.key}>
              <span className={`sr-thumb ${row.kind === 'tailored' ? 'is-tailored' : ''}`} aria-hidden>
                {row.kind === 'tailored' ? <Briefcase size={24} /> : <FileText size={26} />}
              </span>

              <div className="sr-meta">
                <h2>
                  {row.heading}
                  {row.kind === 'tailored' ? (
                    <span className="sr-badge">Tailored</span>
                  ) : (
                    <button
                      type="button"
                      className={`sr-star ${row.favourite ? 'is-on' : ''}`}
                      onClick={() => toggleFavourite(row.base!)}
                      aria-pressed={row.favourite}
                      aria-label={row.favourite ? 'Remove from favourites' : 'Mark as favourite'}
                      disabled={busyId === row.key}
                    >
                      <Star size={16} filled={row.favourite} />
                    </button>
                  )}
                </h2>
                <p>
                  {row.kind === 'tailored' && row.company ? `${row.subheading} · ` : ''}
                  {row.kind === 'tailored' ? '' : `${row.subheading} · `}
                  Updated {timeAgo(Date.parse(row.updatedAt))}
                </p>
                <div className="sr-tags">
                  {row.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="sr-tag">{tag}</span>
                  ))}
                  {row.tags.length > 3 && (
                    <span className="sr-tag is-more">+{row.tags.length - 3}</span>
                  )}
                  {row.tags.length === 0 && <span className="sr-tag is-more">No skills listed</span>}
                </div>
              </div>

              <div className="sr-score">
                <ScoreRing score={row.score} />
                <div>
                  <strong>{row.kind === 'tailored' ? 'Match Score' : 'ATS Score'}</strong>
                  <span className={`chip ${row.good ? 'chip-green' : 'chip-amber'}`}>
                    {row.good ? 'Good Match' : 'Needs Improvement'}
                  </span>
                </div>
              </div>

              <div className="sr-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => viewAnalysis(row)}
                  disabled={busyId === row.key}
                >
                  <BarChart size={15} />{' '}
                  {busyId === row.key
                    ? 'Opening…'
                    : row.kind === 'tailored'
                      ? 'View Match'
                      : 'View Analysis'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => download(row)}
                  disabled={busyId === row.key}
                >
                  <Download size={15} /> Download
                </button>
              </div>

              <div className="sr-menu-wrap" ref={menuId === row.key ? menuRef : undefined}>
                <button
                  type="button"
                  className="sr-more"
                  onClick={() => setMenuId(menuId === row.key ? null : row.key)}
                  aria-expanded={menuId === row.key}
                  aria-label={`More actions for ${row.heading}`}
                >
                  ⋯
                </button>
                {menuId === row.key && (
                  <div className="sr-menu" role="menu">
                    {row.kind === 'base' && (
                      <button type="button" role="menuitem" onClick={() => rename(row.base!)}>
                        Rename
                      </button>
                    )}
                    <button type="button" role="menuitem" onClick={() => download(row)}>
                      Download text
                    </button>
                    {row.kind === 'base' && (
                      <button type="button" role="menuitem" className="is-danger" onClick={() => remove(row.base!)}>
                        <Trash size={14} /> Delete
                      </button>
                    )}
                    {row.kind === 'tailored' && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuId(null);
                          navigate(`/dashboard/job-match?match=${row.match!.id}`);
                        }}
                      >
                        Manage on Job Match
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="card sr-tip">
        <span className="sr-tip-icon"><Sparkles size={18} /></span>
        <div>
          <strong>Pro Tip</strong>
          <p>
            Create different versions of your resume tailored for different roles. Compare ATS
            scores and see which one performs best.
          </p>
        </div>
        <Link className="btn btn-ghost" to="/dashboard/analysis">Analyze another</Link>
      </section>
    </>
  );
}
