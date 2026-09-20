import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ApiError, type JobMatch, type LibraryItem, type SavedResume } from '../lib/api';
import { timeAgo } from '../lib/activity';
import { downloadText } from '../lib/diff';
import { PdfPreview } from '../components/PdfPreview';
import { Pagination } from '../components/Pagination';
import { useDebounced } from '../hooks/useDebounced';
import './SavedResumes.css';

type Sort = 'modified' | 'score' | 'name';
type Source = 'all' | 'base' | 'tailored';

const PAGE_SIZE = 10;

/**
 * One list, two origins: resumes you analysed, and the company-specific
 * versions generated on the Job Match page.
 *
 * Both come from /api/library, which merges the two tables and does the
 * sorting, filtering and paging — a page of the merged list is not a page of
 * either source, so neither can paginate on its own.
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

/** What each stored file is called in the viewer's title bar. */
const LABELS: Record<'original' | 'improved' | 'tailored', string> = {
  original: 'Original PDF',
  improved: 'Improved resume',
  tailored: 'Tailored resume',
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

  const [items, setItems] = useState<LibraryItem[]>([]);
  // Rows matching the filters, and rows in the library at all — the second
  // tells an empty search apart from a library with nothing in it.
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [roles, setRoles] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [listing, setListing] = useState(false);
  /** Bumped by anything that changes the list, to refetch the current page. */
  const [reloadKey, setReloadKey] = useState(0);

  const [source, setSource] = useState<Source>('all');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sort, setSort] = useState<Sort>('modified');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  /** The PDF currently shown in the viewer, if any. */
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const search = useDebounced(query);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  // Any change of filter or sort is a different list, so it starts at its
  // own first page rather than wherever the last one was left. Adjusted
  // during render rather than in an effect: an effect would let the fetch
  // below run once against the old page before the reset landed.
  const filters = `${source}|${roleFilter}|${sort}|${search}`;
  const [lastFilters, setLastFilters] = useState(filters);
  if (filters !== lastFilters) {
    setLastFilters(filters);
    setPage(0);
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setListing(true);

    api
      .readLibrary(token, {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        source,
        role: roleFilter,
        sort,
        q: search,
      })
      .then((result) => {
        if (cancelled) return;
        // Deleting the last row on a page leaves it empty — step back one.
        const lastPage = Math.max(0, Math.ceil(result.total / PAGE_SIZE) - 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setItems(result.items);
        setTotal(result.total);
        setTotalAll(result.total_all);
        setRoles(result.roles);
        setState('ready');
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Could not load your resumes.');
        // A later page failing is worth an alert, not a blank screen.
        setState((previous) => (previous === 'loading' ? 'error' : previous));
      })
      .finally(() => {
        if (!cancelled) setListing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, page, source, roleFilter, sort, search, reloadKey]);

  useEffect(() => {
    if (menuId === null) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuId]);

  // The server has already filtered, sorted and sliced; the only thing left
  // is picking the chips off whichever payload the row came with.
  const rows = useMemo<Row[]>(
    () =>
      items.map((item) => ({
        key: item.key,
        kind: item.kind,
        heading: item.heading,
        subheading: item.subheading,
        company: item.company,
        role: item.role,
        score: item.score,
        good: item.good,
        tags: item.match ? item.match.role_summary.key_skills : item.base?.tags ?? [],
        favourite: item.favourite,
        updatedAt: item.updated_at,
        base: item.base ?? undefined,
        match: item.match ?? undefined,
      })),
    [items],
  );

  const toggleFavourite = async (item: SavedResume) => {
    if (!token) return;
    setBusyId(`r-${item.id}`);
    try {
      await api.updateResume(token, item.id, { favourite: !item.favourite });
      // Favourites are pinned to the top, so the order changed with it.
      reload();
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
      reload();
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
      await api.updateResume(token, item.id, { filename: next.trim() });
      reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not rename that resume.');
    } finally {
      setBusyId(null);
    }
  };

  /** Base resumes download their extracted text; tailored ones the generated text. */
  /**
   * Open one of the stored PDFs.
   *
   * The link is re-fetched immediately before opening rather than reused from
   * the list: presigned URLs expire, and a tab left open for an hour would
   * otherwise hand the user a 403.
   */
  const openPdf = async (row: Row, which: 'original' | 'improved' | 'tailored') => {
    if (!token) return;
    setBusyId(row.key);
    setMenuId(null);
    try {
      let url: string | null = null;
      if (which === 'tailored') {
        url = (await api.readJobMatch(token, row.match!.id)).optimized_url;
      } else {
        const detail = await api.readResume(token, row.base!.id);
        url = which === 'improved' ? detail.improved_url : detail.resume_url;
      }
      if (!url) {
        setError('That PDF is not stored. It may predate file storage being enabled.');
        return;
      }
      setPreview({ url, title: `${row.heading} — ${LABELS[which]}` });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not open that PDF.');
    } finally {
      setBusyId(null);
    }
  };

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

      {totalAll > 0 && (
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

      {totalAll === 0 ? (
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
      ) : total === 0 ? (
        <p className="sr-none">No resumes match that search.</p>
      ) : (
        <ul className="sr-list">
          {rows.map((row) => (
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
                    {row.kind === 'base' && row.base!.resume_url && (
                      <button type="button" role="menuitem" onClick={() => openPdf(row, 'original')}>
                        Original PDF
                      </button>
                    )}
                    {row.kind === 'base' && row.base!.improved_url && (
                      <button type="button" role="menuitem" onClick={() => openPdf(row, 'improved')}>
                        Improved resume PDF
                      </button>
                    )}
                    {row.kind === 'tailored' && row.match!.optimized_url && (
                      <button type="button" role="menuitem" onClick={() => openPdf(row, 'tailored')}>
                        Tailored resume PDF
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

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onChange={setPage}
        noun="resumes"
        busy={listing}
      />

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

      {preview && (
        <PdfPreview
          url={preview.url}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
