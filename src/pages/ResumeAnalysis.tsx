import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { RadarChart, ScoreGauge, type RadarAxis } from '../components/dashboard/Charts';
import { AlertCircle, ArrowRight, ChevronLeft, Download, Upload } from '../components/Icons';
import { AnalysisGate } from '../components/AnalysisGate';
import { useAuth } from '../auth/context';
import * as api from '../lib/api';
import { ApiError, type AnalysisResult, type AppConfig, type Improvements } from '../lib/api';
import { recordActivity } from '../lib/activity';
import './ResumeAnalysis.css';

type Tab = 'overview' | 'skills' | 'weaknesses' | 'recommendations';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'skills', label: 'Skills Analysis' },
  { id: 'weaknesses', label: 'Weaknesses' },
  { id: 'recommendations', label: 'Recommendations' },
];

const ROLE_KEY = 'cvexpert-target-role';

/**
 * Score bands. The backend treats >= 7 as a strength and <= 5 as missing
 * (agents.py), so those are the boundaries used throughout.
 */
function band(score: number): { key: 'present' | 'partial' | 'missing'; label: string } {
  if (score >= 7) return { key: 'present', label: 'Present' };
  if (score === 6) return { key: 'partial', label: 'Partial' };
  return { key: 'missing', label: 'Missing' };
}

const DISTRIBUTION = [
  { label: 'Excellent', hint: '9–10', test: (s: number) => s >= 9, color: '#16a34a' },
  { label: 'Strong', hint: '7–8', test: (s: number) => s >= 7 && s <= 8, color: '#22b356' },
  { label: 'Moderate', hint: '6', test: (s: number) => s === 6, color: '#f5a524' },
  { label: 'Weak', hint: '1–5', test: (s: number) => s >= 1 && s <= 5, color: '#ef4444' },
  { label: 'Not found', hint: '0', test: (s: number) => s === 0, color: '#94a3b8' },
];

/** Builds a Markdown report from the analysis — no backend endpoint needed. */
function downloadReport(analysis: AnalysisResult, role: string) {
  const entries = Object.entries(analysis.skill_scores).sort((a, b) => b[1] - a[1]);
  const lines = [
    '# CVExpert — Resume Analysis',
    '',
    `Generated: ${new Date().toLocaleString()}`,
    ...(role ? [`Target role: ${role}`] : []),
    '',
    `## ATS Score: ${analysis.overall_score}/100 (${analysis.selected ? 'Good Match' : 'Needs Work'})`,
    '',
    analysis.reasoning,
    '',
    '## Skill scores',
    '',
    ...entries.map(([skill, score]) => `- ${skill}: ${score}/10 — ${band(score).label}`),
    '',
    '## Key strengths',
    '',
    ...(analysis.strengths.length ? analysis.strengths.map((s) => `- ${s}`) : ['- None recorded']),
    '',
    '## Areas for improvement',
    '',
    ...(analysis.missing_skills.length
      ? analysis.missing_skills.map((s) => `- ${s} (${analysis.skill_scores[s] ?? 0}/10)`)
      : ['- None recorded']),
  ];

  if (analysis.detailed_weaknesses?.length) {
    lines.push('', '## Detailed weaknesses', '');
    for (const weakness of analysis.detailed_weaknesses) {
      lines.push(`### ${weakness.skill} (${weakness.score}/10)`, '', weakness.detail, '');
      for (const suggestion of weakness.suggestions ?? []) lines.push(`- ${suggestion}`);
      if (weakness.example) lines.push('', `> ${weakness.example}`);
      lines.push('');
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `cvexpert-analysis-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ upload */

function UploadPanel({
  config,
  onAnalyzed,
}: {
  config: AppConfig | null;
  onAnalyzed: (result: AnalysisResult) => void;
}) {
  const { token } = useAuth();
  const [resume, setResume] = useState<File | null>(null);
  const [jd, setJd] = useState<File | null>(null);
  const [role, setRole] = useState(() => {
    try {
      return localStorage.getItem(ROLE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = config ? Object.keys(config.roles) : [];
  const needsKey = config ? !config.server_has_api_key : false;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!resume) {
      setError('Choose a resume PDF to analyze.');
      return;
    }
    if (!jd && !role) {
      setError('Pick a target role, or upload a job description.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const result = await api.analyze(token, {
        resume,
        role,
        jobDescription: jd,
        apiKey: apiKey.trim() || undefined,
      });
      try {
        if (role) localStorage.setItem(ROLE_KEY, role);
      } catch {
        /* storage unavailable */
      }
      recordActivity({
        kind: 'analysis',
        label: 'Resume analyzed',
        badge: `${result.overall_score}/100`,
      });
      onAnalyzed(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Analysis failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <form className="card ra-upload" onSubmit={submit}>
      <span className="ra-upload-icon"><Upload size={22} /></span>
      <h2>Analyze your resume</h2>
      <p>Upload a PDF and pick the role you're targeting. Analysis usually takes under a minute.</p>

      <label className="form-field">
        <span>Resume (PDF)</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setResume(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
      </label>

      <label className="form-field">
        <span>Target role</span>
        <select value={role} onChange={(e) => setRole(e.target.value)} disabled={busy || !!jd}>
          <option value="">Select a role…</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Or a job description (PDF or TXT) — optional</span>
        <input
          type="file"
          accept="application/pdf,.pdf,.txt,text/plain"
          onChange={(e) => setJd(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
        <small>When provided, the job description is used instead of the role.</small>
      </label>

      {needsKey && (
        <label className="form-field">
          <span>OpenAI API key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
            disabled={busy}
          />
          <small>The server has no key configured, so one is needed for this request.</small>
        </label>
      )}

      {error && <p className="form-alert" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary ra-upload-submit" disabled={busy}>
        {busy ? 'Analyzing…' : 'Analyze Resume'}
      </button>
    </form>
  );
}

/**
 * Strength / improvement lists. Real analyses are lopsided — four strengths
 * against a dozen gaps — so both lists cap at six with a toggle, and the row
 * they sit in is top-aligned rather than stretched.
 */
function ScoreList({
  skills,
  scores,
  tone,
  empty,
}: {
  skills: string[];
  scores: Record<string, number>;
  tone: 'ok' | 'bad';
  empty: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 6;

  if (skills.length === 0) return <p className="ra-muted">{empty}</p>;

  const shown = expanded ? skills : skills.slice(0, LIMIT);

  return (
    <>
      <ul className="ra-list">
        {shown.map((skill) => (
          <li key={skill}>
            <span className={`ra-tick ${tone}`}>{tone === 'ok' ? '\u2713' : '\u2715'}</span>
            {skill}
            <em>{scores[skill] ?? 0}/10</em>
          </li>
        ))}
      </ul>
      {skills.length > LIMIT && (
        <button type="button" className="ra-link" onClick={() => setExpanded((open) => !open)}>
          {expanded ? 'Show less' : `Show all ${skills.length}`}
        </button>
      )}
    </>
  );
}

/* ----------------------------------------------------------- recommendations */

function Recommendations({
  analysis,
  config,
  staleResumeId,
  onReconnected,
}: {
  analysis: AnalysisResult;
  config: AppConfig | null;
  /** Set when the scores were read back from the database, not this session. */
  staleResumeId: number | null;
  onReconnected: () => void;
}) {
  const { token } = useAuth();
  const [areas, setAreas] = useState<string[]>([]);
  const [result, setResult] = useState<Improvements | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Whatever the rewrite page already generated is reused rather than re-billed.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .getCachedImprovements(token)
      .then((cached) => {
        if (!cancelled && cached && Object.keys(cached).length > 0) setResult(cached);
      })
      .catch(() => {
        /* nothing cached yet */
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const available = config?.improvement_areas ?? [];
  const targetRole = (() => {
    try {
      return localStorage.getItem(ROLE_KEY) ?? '';
    } catch {
      return '';
    }
  })();

  const toggle = (area: string) =>
    setAreas((current) =>
      current.includes(area) ? current.filter((a) => a !== area) : [...current, area],
    );

  const generate = async () => {
    if (!token) return;
    setError(null);
    setBusy(true);
    try {
      // No selection means the server offers every area and the model keeps
      // the ones that actually apply to this resume.
      setResult(await api.getImprovements(token, { improvementAreas: areas, targetRole }));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not generate recommendations.');
    } finally {
      setBusy(false);
    }
  };

  // Reading the scores back from the database is free; asking the model for
  // advice about them is not, and needs the session reconnected first.
  if (staleResumeId !== null) {
    return (
      <AnalysisGate
        icon={<AlertCircle size={22} />}
        title="Analyze a resume first"
        body="Recommendations are generated from your analysed resume."
        resumeId={staleResumeId}
        onReconnected={onReconnected}
      />
    );
  }

  return (
    <section className="card ra-panel">
      <h2>Recommendations</h2>
      <p className="ra-panel-sub">
        Leave everything unselected to let the AI decide which areas matter, or narrow it down
        yourself. This calls the AI, so it takes a few seconds.
      </p>

      <div className="ra-chips">
        {available.map((area) => (
          <button
            key={area}
            type="button"
            className={areas.includes(area) ? 'is-on' : ''}
            onClick={() => toggle(area)}
            disabled={busy}
          >
            {area}
          </button>
        ))}
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}

      <button type="button" className="btn btn-primary" onClick={generate} disabled={busy}>
        {busy
          ? 'Generating…'
          : areas.length === 0
            ? 'Let the AI choose areas'
            : `Generate for ${areas.length} area${areas.length === 1 ? '' : 's'}`}
      </button>

      {result &&
        Object.entries(result).map(([area, detail]) => (
          <article className="ra-rec" key={area}>
            <h3>{area}</h3>
            {detail.description && <p>{detail.description}</p>}
            {detail.specific && detail.specific.length > 0 && (
              <ul>
                {detail.specific.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
            {detail.before_after && (
              <div className="ra-beforeafter">
                <div>
                  <h4>Before</h4>
                  <pre>{detail.before_after.before}</pre>
                </div>
                <div>
                  <h4>After</h4>
                  <pre>{detail.before_after.after}</pre>
                </div>
              </div>
            )}
          </article>
        ))}

      {result && Object.keys(result).length === 0 && (
        <p className="ra-muted">The AI returned no suggestions for those areas.</p>
      )}

      {!result && analysis.missing_skills.length === 0 && (
        <p className="ra-muted">
          No weak skills were found, so there may be little to suggest.
        </p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------- page */

export default function ResumeAnalysis() {
  const { token } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  /** Set when an analysis is on file but this session cannot generate from it. */
  const [staleResumeId, setStaleResumeId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  /** Re-opens the upload form once an analysis already fills the page. */
  const [showUpload, setShowUpload] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([api.getAnalysis(token), api.getConfig(token).catch(() => null)])
      .then(([result, cfg]) => {
        if (cancelled) return;
        setAnalysis(result.result);
        // The scores render either way; only the generative tab cares.
        setStaleResumeId(result.active ? null : result.resumeId);
        setConfig(cfg);
        setState('ready');
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Could not load the analysis.');
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const sorted = useMemo(
    () => (analysis ? Object.entries(analysis.skill_scores).sort((a, b) => b[1] - a[1]) : []),
    [analysis],
  );

  const radarAxes = useMemo<RadarAxis[]>(() => {
    if (sorted.length < 3) return [];
    // Sample across the whole range so the shape shows strengths and gaps.
    const wanted = Math.min(6, sorted.length);
    const step = (sorted.length - 1) / (wanted - 1);
    return Array.from({ length: wanted }, (_, i) => {
      const [label, value] = sorted[Math.round(i * step)];
      return { label, value };
    });
  }, [sorted]);

  const targetRole = (() => {
    try {
      return localStorage.getItem(ROLE_KEY) ?? '';
    } catch {
      return '';
    }
  })();

  const back = (
    <Link className="ra-back" to="/dashboard">
      <ChevronLeft size={17} /> Resume Analysis
    </Link>
  );

  if (state === 'loading') {
    return (
      <>
        {back}
        <div className="card ov-placeholder">Loading your analysis…</div>
      </>
    );
  }

  if (state === 'error') {
    return (
      <>
        {back}
        <div className="card ov-placeholder ov-error">{error}</div>
      </>
    );
  }

  if (!analysis) {
    return (
      <>
        {back}
        <header className="ra-head">
          <div>
            <h1>Resume Analysis</h1>
            <p>Get a complete analysis of your resume and find out how to improve.</p>
          </div>
        </header>
        <UploadPanel
          config={config}
          onAnalyzed={(result) => {
            setAnalysis(result);
            setTab('overview');
          }}
        />
      </>
    );
  }

  const total = sorted.length;

  return (
    <>
      {back}

      <header className="ra-head">
        <div>
          <h1>Resume Analysis</h1>
          <p>Get a complete analysis of your resume and find out how to improve.</p>
        </div>
        <div className="ra-head-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowUpload((open) => !open)}
            aria-expanded={showUpload}
          >
            <Upload size={16} /> {showUpload ? 'Cancel' : 'Add new resume'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => downloadReport(analysis, targetRole)}
          >
            <Download size={16} /> Download Report
          </button>
        </div>
      </header>

      {showUpload && (
        <UploadPanel
          config={config}
          onAnalyzed={(result) => {
            setAnalysis(result);
            setTab('overview');
            setShowUpload(false);
          }}
        />
      )}

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

      {tab === 'overview' && (
        <>
          <div className="ra-grid-2">
            <section className="card ra-score">
              <h2>ATS Score</h2>
              <div className="ov-gauge">
                <ScoreGauge score={analysis.overall_score} />
                <div className="ov-gauge-text">
                  <strong>{analysis.overall_score}</strong>
                  <span>/100</span>
                </div>
              </div>
              <span className={`chip ${analysis.selected ? 'chip-green' : 'chip-red'}`}>
                {analysis.selected ? 'Good Match' : 'Needs Work'}
              </span>
              {config && (
                <p className="ra-score-note">
                  The cutoff for this role is {config.cutoff_score}/100.
                </p>
              )}
            </section>

            <section className="card ra-panel">
              <h2>Score Distribution</h2>
              <p className="ra-panel-sub">How your {total} evaluated skills scored.</p>
              <ul className="ra-dist">
                {DISTRIBUTION.map((bucket) => {
                  const count = sorted.filter(([, s]) => bucket.test(s)).length;
                  return (
                    <li key={bucket.label}>
                      <span className="ra-dist-name">
                        {bucket.label} <em>{bucket.hint}</em>
                      </span>
                      <span className="ra-dist-bar">
                        <i
                          style={{
                            width: total ? `${(count / total) * 100}%` : '0%',
                            background: bucket.color,
                          }}
                        />
                      </span>
                      <span className="ra-dist-count">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <div className="ra-grid-2">
            <section className="card ra-panel">
              <h2>Skill Match Analysis</h2>
              <ul className="ra-legend">
                <li><i style={{ background: '#22b356' }} /> Present (7+)</li>
                <li><i style={{ background: '#f5a524' }} /> Partial (6)</li>
                <li><i style={{ background: '#ef4444' }} /> Missing (≤5)</li>
              </ul>
              <ul className="ra-skills">
                {sorted.slice(0, 8).map(([skill, score]) => (
                  <li key={skill}>
                    <span className="ra-skill-name">{skill}</span>
                    <span className="ra-skill-bar">
                      <i className={`is-${band(score).key}`} style={{ width: `${score * 10}%` }} />
                    </span>
                    <span className="ra-skill-score">{score}/10</span>
                  </li>
                ))}
              </ul>
              {total > 8 && (
                <button type="button" className="ra-link" onClick={() => setTab('skills')}>
                  View All Skills <ArrowRight size={14} />
                </button>
              )}
            </section>

            <section className="card ra-panel">
              <h2>Skill Profile</h2>
              <ul className="ra-legend">
                <li><i style={{ background: '#e7352b' }} /> Your scores</li>
                <li><i style={{ background: '#94a3b8' }} /> Target (10/10)</li>
              </ul>
              {radarAxes.length >= 3 ? (
                <>
                  <RadarChart axes={radarAxes} />
                  <p className="ra-muted ra-radar-note">
                    Six skills sampled across your score range.
                  </p>
                </>
              ) : (
                <p className="ra-muted">Not enough skills were evaluated to plot a profile.</p>
              )}
            </section>
          </div>

          <div className="ra-grid-2 is-top">
            <section className="card ra-panel">
              <h2>Key Strengths <em className="ra-count">{analysis.strengths.length}</em></h2>
              <ScoreList
                skills={analysis.strengths}
                scores={analysis.skill_scores}
                tone="ok"
                empty="No skills scored 7 or above."
              />
            </section>

            <section className="card ra-panel">
              <h2>Areas for Improvement <em className="ra-count">{analysis.missing_skills.length}</em></h2>
              <ScoreList
                skills={analysis.missing_skills}
                scores={analysis.skill_scores}
                tone="bad"
                empty="Nothing scored at or below 5 — good coverage."
              />
            </section>
          </div>
        </>
      )}

      {tab === 'skills' && (
        <section className="card ra-panel">
          <h2>Skills Analysis</h2>
          <p className="ra-panel-sub">Every skill evaluated, with the reason behind each score.</p>
          <ul className="ra-skilllist">
            {sorted.map(([skill, score]) => (
              <li key={skill}>
                <div className="ra-skilllist-head">
                  <strong>{skill}</strong>
                  <span className={`ra-badge is-${band(score).key}`}>{band(score).label}</span>
                  <span className="ra-skill-score">{score}/10</span>
                </div>
                {analysis.skill_reasoning[skill] && <p>{analysis.skill_reasoning[skill]}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'weaknesses' && (
        <section className="card ra-panel">
          <h2>Weaknesses</h2>
          {!analysis.detailed_weaknesses || analysis.detailed_weaknesses.length === 0 ? (
            <p className="ra-muted">
              <AlertCircle size={16} /> No detailed weakness breakdown was returned for this
              analysis. The backend only produces one when skills score at or below 5.
            </p>
          ) : (
            <ul className="ra-weak">
              {analysis.detailed_weaknesses.map((weakness) => (
                <li key={weakness.skill}>
                  <div className="ra-skilllist-head">
                    <strong>{weakness.skill}</strong>
                    <span className="ra-skill-score">{weakness.score}/10</span>
                  </div>
                  <p>{weakness.detail}</p>
                  {weakness.suggestions && weakness.suggestions.length > 0 && (
                    <ul>
                      {weakness.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                  {weakness.example && <blockquote>{weakness.example}</blockquote>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'recommendations' && (
        <Recommendations
          analysis={analysis}
          config={config}
          staleResumeId={staleResumeId}
          onReconnected={() => setReloadKey((key) => key + 1)}
        />
      )}
    </>
  );
}
