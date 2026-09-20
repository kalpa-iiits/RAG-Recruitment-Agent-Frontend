import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  Eye,
  FileText,
  Rocket,
  Sparkles,
  Target,
  TrendUp,
} from '../components/Icons';
import { AnalysisGate } from '../components/AnalysisGate';
import { useAuth } from '../auth/context';
import * as api from '../lib/api';
import { ApiError, type AnalysisResult, type AppConfig } from '../lib/api';
import { diffLines, diffStats, downloadText } from '../lib/diff';
import { PdfPreview } from '../components/PdfPreview';
import { recordActivity } from '../lib/activity';
import './ResumeRewrite.css';

type Tab = 'side' | 'changes' | 'download';

const TABS: { id: Tab; label: string }[] = [
  { id: 'side', label: 'Side by Side View' },
  { id: 'changes', label: 'Changes Summary' },
  { id: 'download', label: 'Download' },
];

const ROLE_KEY = 'cvexpert-target-role';

/** Presentation only — the areas and their text come from the model. */
const AREA_ICONS: Record<string, typeof FileText> = {
  Content: FileText,
  Format: FileText,
  'Skills Highlighting': Target,
  'Experience Description': Rocket,
  Education: FileText,
  Projects: Target,
  Achievements: TrendUp,
  'Overall Structure': FileText,
};

function readRole(): string {
  try {
    return localStorage.getItem(ROLE_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function ResumeRewrite() {
  const { token } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  /** Set when an analysis is on file but this session cannot use it yet. */
  const [staleResumeId, setStaleResumeId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [improved, setImproved] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('side');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState(readRole);
  const [highlight, setHighlight] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState<'generate' | 'apply' | 'areas' | null>(null);
  const [improvements, setImprovements] = useState<api.Improvements | null>(null);
  const [applied, setApplied] = useState<{ before: number | null; after: number } | null>(null);
  /** S3 link to the generated PDF; null until a rewrite exists. */
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  /**
   * Presigned S3 links expire, so refresh before showing the viewer. A tab
   * left open past the expiry would otherwise render an XML AccessDenied.
   */
  const openPreview = async () => {
    if (!token) return;
    try {
      const latest = await api.getImprovedResume(token);
      if (latest.download_url) setPdfUrl(latest.download_url);
    } catch {
      /* fall back to the link already in hand */
    }
    setPreviewing(true);
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      api.getAnalysis(token),
      api.getResumeText(token),
      api.getImprovedResume(token),
      api.getConfig(token).catch(() => null),
      api.getCachedImprovements(token).catch(() => null),
    ])
      .then(([result, resumeText, cached, cfg, areas]) => {
        if (cancelled) return;
        // This page generates against the resume, which needs the live
        // agent — a restored-but-inactive analysis is not enough.
        setAnalysis(result.active ? result.result : null);
        setStaleResumeId(result.active ? null : result.resumeId);
        setOriginal(resumeText);
        setImproved(cached.improved_resume);
        setPdfUrl(cached.download_url);
        setConfig(cfg);
        setImprovements(areas);
        setState('ready');
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Could not load your resume.');
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const diff = useMemo(
    () => (original && improved ? diffLines(original, improved) : []),
    [original, improved],
  );
  const stats = useMemo(() => diffStats(diff), [diff]);

  const generate = async () => {
    if (!token) return;
    setError(null);
    setBusy('generate');
    try {
      const generated = await api.generateImprovedResume(token, {
        targetRole: role,
        highlightSkills: highlight.trim(),
        apiKey: apiKey.trim() || undefined,
      });
      setImproved(generated.improved_resume);
      setPdfUrl(generated.download_url);
      setApplied(null);
      recordActivity({ kind: 'rewrite', label: 'Created improved resume' });
      // The areas card is driven by the model too; fetch it alongside, but
      // don't fail the rewrite if that second call doesn't land.
      if (!improvements) void loadAreas();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not generate the rewrite.');
    } finally {
      setBusy(null);
    }
  };

  /** Asks the model which areas need work — it picks them, not the client. */
  const loadAreas = async () => {
    if (!token) return;
    setBusy((current) => current ?? 'areas');
    try {
      setImprovements(
        await api.getImprovements(token, {
          targetRole: role,
          apiKey: apiKey.trim() || undefined,
        }),
      );
    } catch {
      /* the rewrite is still usable without the areas card */
    } finally {
      setBusy((current) => (current === 'areas' ? null : current));
    }
  };

  const apply = async () => {
    if (!token) return;
    setError(null);
    setBusy('apply');
    try {
      const result = await api.applyImprovedResume(token, apiKey.trim() || undefined);
      setAnalysis(result.analysis_result);
      setApplied({ before: result.previous_score, after: result.analysis_result.overall_score });
      setImproved(null);
      setOriginal(await api.getResumeText(token));
      recordActivity({
        kind: 'analysis',
        label: 'Applied improved resume',
        badge: `${result.analysis_result.overall_score}/100`,
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not apply the changes.');
    } finally {
      setBusy(null);
    }
  };

  const head = (
    <header className="rw-head">
      <h1>AI Resume Improvement</h1>
      <p>Get an optimized version of your resume with AI-powered suggestions.</p>
    </header>
  );

  if (state === 'loading') {
    return (
      <>
        {head}
        <div className="card ov-placeholder">Loading your resume…</div>
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

  if (!analysis || !original) {
    return (
      <>
        {head}
        <AnalysisGate
          icon={<Sparkles size={22} />}
          title="Analyze a resume first"
          body="The rewrite works from your analysed resume, so upload one before generating an improved version."
          resumeId={staleResumeId}
          onReconnected={() => setReloadKey((key) => key + 1)}
        />
      </>
    );
  }

  const sidebar = (
    <div className="rw-aside">
      <section className="card rw-areas">
        <h2>Improvement Areas</h2>

        {improvements && Object.keys(improvements).length > 0 ? (
          <>
            <ul>
              {Object.entries(improvements).map(([area, detail]) => {
                const Icon = AREA_ICONS[area] ?? FileText;
                return (
                  <li key={area}>
                    <span className="rw-area-icon"><Icon size={18} /></span>
                    <span>
                      <strong>{area}</strong>
                      {detail.description && <em>{detail.description}</em>}
                      {detail.specific && detail.specific.length > 0 && (
                        <details>
                          <summary>
                            {detail.specific.length} suggestion{detail.specific.length === 1 ? '' : 's'}
                          </summary>
                          <ul className="rw-area-suggestions">
                            {detail.specific.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="ra-link" onClick={loadAreas} disabled={busy !== null}>
              {busy === 'areas' ? 'Refreshing…' : 'Refresh areas'}
            </button>
          </>
        ) : (
          <div className="rw-areas-empty">
            <p>
              Ask the AI which parts of your resume need work. It picks the areas and writes the
              guidance from your analysis.
            </p>
            <button type="button" className="btn btn-ghost" onClick={loadAreas} disabled={busy !== null}>
              {busy === 'areas' ? 'Analyzing…' : 'Find improvement areas'}
            </button>
          </div>
        )}

        {analysis.missing_skills.length > 0 && (
          <p className="rw-areas-note">
            Skills the rewrite is told to work in: {analysis.missing_skills.slice(0, 6).join(', ')}
            {analysis.missing_skills.length > 6 && ` +${analysis.missing_skills.length - 6} more`}.
          </p>
        )}
      </section>

      <section className="card rw-tip">
        <h3>Pro Tip</h3>
        <p>
          Quantify your achievements with specific numbers to make a stronger impact on
          recruiters.
        </p>
      </section>
    </div>
  );

  const generatePanel = (
    <section className="card rw-generate">
      <span className="rw-empty-icon"><Sparkles size={22} /></span>
      <h2>Generate an improved resume</h2>
      <p>
        The AI rewrites your resume around the skills your analysis flagged. This takes a few
        seconds.
      </p>

      <label className="form-field">
        <span>Target role</span>
        <select value={role} onChange={(e) => setRole(e.target.value)} disabled={busy !== null}>
          <option value="">No specific role</option>
          {Object.keys(config?.roles ?? {}).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Skills to highlight — optional</span>
        <input
          type="text"
          value={highlight}
          onChange={(e) => setHighlight(e.target.value)}
          placeholder="e.g. FastAPI, Docker, AWS"
          disabled={busy !== null}
        />
        <small>Comma separated. Left blank, your missing and strong skills are used.</small>
      </label>

      {config && !config.server_has_api_key && (
        <label className="form-field">
          <span>OpenAI API key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
            disabled={busy !== null}
          />
        </label>
      )}

      {error && <p className="form-alert" role="alert">{error}</p>}

      <button type="button" className="btn btn-primary" onClick={generate} disabled={busy !== null}>
        {busy === 'generate' ? 'Generating…' : 'Generate Improved Resume'}
      </button>
    </section>
  );

  return (
    <>
      {head}

      {applied && (
        <p className="rw-applied" role="status">
          Applied. Your resume was re-scored:{' '}
          {applied.before !== null ? `${applied.before} → ` : ''}
          <strong>{applied.after}/100</strong>.{' '}
          <Link to="/dashboard/analysis">See the new analysis</Link>
        </p>
      )}

      {!improved ? (
        <div className="rw-grid">
          {generatePanel}
          {sidebar}
        </div>
      ) : (
        <>
          <nav className="ra-tabs" role="tablist">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={tab === id ? 'is-active' : ''}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          {error && <p className="form-alert" role="alert">{error}</p>}

          {tab === 'side' && (
            <div className="rw-grid">
              <div className="rw-compare">
                <section className="card rw-doc">
                  <h2>Original Resume</h2>
                  <pre>{original}</pre>
                </section>

                <section className="card rw-doc is-improved">
                  <h2>
                    AI Improved Version
                    <span className="rw-badge"><Sparkles size={13} /> AI Optimized</span>
                  </h2>
                  <pre>{improved}</pre>
                </section>
              </div>
              {sidebar}
            </div>
          )}

          {tab === 'changes' && (
            <section className="card ra-panel">
              <h2>Changes Summary</h2>
              <p className="ra-panel-sub">
                Line-level comparison between your resume and the rewrite.
              </p>
              <ul className="rw-stats">
                <li className="is-add"><strong>{stats.added}</strong> lines added</li>
                <li className="is-remove"><strong>{stats.removed}</strong> lines removed</li>
                <li><strong>{stats.unchanged}</strong> unchanged</li>
              </ul>
              <div className="rw-diff">
                {diff
                  .filter((line) => line.text.trim() !== '')
                  .map((line, i) => (
                    <p key={i} className={`rw-diff-line is-${line.type}`}>
                      <span aria-hidden>
                        {line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}
                      </span>
                      {line.text}
                    </p>
                  ))}
              </div>
            </section>
          )}

          {tab === 'download' && (
            <section className="card ra-panel rw-download">
              <h2>Download</h2>
              <p className="ra-panel-sub">
                {pdfUrl
                  ? 'A typeset PDF is stored with this resume. Plain text is there too, for pasting into your own template.'
                  : 'Saved as plain text, ready to paste into your resume template.'}
              </p>
              <div className="rw-download-actions">
                {pdfUrl && (
                  <button type="button" className="btn btn-primary" onClick={openPreview}>
                    <Eye size={16} /> View improved resume (PDF)
                  </button>
                )}
                {pdfUrl && (
                  <a
                    className="btn btn-ghost"
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={16} /> Download PDF
                  </a>
                )}
                <button
                  type="button"
                  className={pdfUrl ? 'btn btn-ghost' : 'btn btn-primary'}
                  onClick={() => downloadText('cvexpert-improved-resume.txt', improved)}
                >
                  <Download size={16} /> Improved resume (text)
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => downloadText('cvexpert-original-resume.txt', original)}
                >
                  <Download size={16} /> Original resume
                </button>
              </div>
            </section>
          )}

          <div className="rw-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={apply} disabled={busy !== null}>
              {busy === 'apply' ? 'Applying…' : 'Apply These Changes'} <ArrowRight />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-lg"
              onClick={() => downloadText('cvexpert-improved-resume.txt', improved)}
            >
              <Download size={16} /> Download Improved Resume
            </button>
            {pdfUrl && (
              <button
                type="button"
                className="btn btn-ghost btn-lg"
                onClick={openPreview}
              >
                <Eye size={16} /> View PDF
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-lg"
              onClick={generate}
              disabled={busy !== null}
            >
              {busy === 'generate' ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
          {previewing && pdfUrl && (
            <PdfPreview
              url={pdfUrl}
              title="Improved resume"
              onClose={() => setPreviewing(false)}
            />
          )}
          <p className="rw-apply-note">
            Applying replaces your analysed resume with this version and re-scores it against the
            same skills.
          </p>
        </>
      )}
    </>
  );
}
