import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Download,
  Eye,
  FileText,
  Pencil,
  Sparkles,
  Trash,
} from '../components/Icons';
import { useAuth } from '../auth/context';
import * as api from '../lib/api';
import { ApiError, type AnalysisResult, type AppConfig, type JobMatch as Match } from '../lib/api';
import { downloadText } from '../lib/diff';
import { recordActivity } from '../lib/activity';
import './JobMatch.css';

const MAX_CHARS = 20000;
const MIN_CHARS = 50;

const SAMPLE_JD = `We are looking for a Senior AI Engineer to join our team.

Responsibilities:
- Build and deploy LLM applications
- Work with Python, PyTorch, AWS
- Experience with MLOps, Docker, Kubernetes
- Collaborate with cross-functional teams

Requirements:
- 5+ years of experience
- Strong knowledge of machine learning
- Experience with cloud platforms (AWS/GCP)
- Familiarity with Airflow and CI/CD pipelines`;

function Donut({ score, label }: { score: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const colour = score >= 75 ? '#16a34a' : score >= 55 ? '#f5a524' : '#ef4444';

  return (
    <div className="jm-donut">
      <svg viewBox="0 0 100 100" role="img" aria-label={`${label} ${score} percent`}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--line)" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke={colour} strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span>
        <strong>{score}%</strong>
        <em>{label}</em>
      </span>
    </div>
  );
}

export default function JobMatch() {
  const { token } = useAuth();
  const [params] = useSearchParams();
  // Saved Resumes links here with ?match=<id> to open a specific job.
  const requestedId = Number(params.get('match')) || null;

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [current, setCurrent] = useState<Match | null>(null);

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [jd, setJd] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState<'analyze' | 'generate' | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      api.getAnalysis(token),
      api.getConfig(token).catch(() => null),
      api.listJobMatches(token).catch(() => []),
    ])
      .then(([result, cfg, rows]) => {
        if (cancelled) return;
        setAnalysis(result);
        setConfig(cfg);
        setMatches(rows);
        setCurrent(rows.find((row) => row.id === requestedId) ?? rows[0] ?? null);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token, requestedId]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return matches;
    return matches.filter(
      (m) =>
        m.company.toLowerCase().includes(needle) ||
        m.title.toLowerCase().includes(needle) ||
        m.role_summary.key_skills.some((s) => s.toLowerCase().includes(needle)),
    );
  }, [matches, query]);

  const analyze = async () => {
    if (!token) return;
    const text = jd.trim();
    if (text.length < MIN_CHARS) {
      setError(`Paste at least ${MIN_CHARS} characters of the job description.`);
      return;
    }
    setError(null);
    setBusy('analyze');
    try {
      const match = await api.analyzeJobMatch(token, {
        jobDescription: text,
        company: company.trim(),
        title: title.trim(),
        apiKey: apiKey.trim() || undefined,
      });
      setMatches((rows) => [match, ...rows]);
      setCurrent(match);
      setJd('');
      setCompany('');
      setTitle('');
      recordActivity({
        kind: 'analysis',
        label: `Matched against ${match.company || match.title || 'a job'}`,
        badge: `${match.match_score}%`,
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not analyze that job.');
    } finally {
      setBusy(null);
    }
  };

  const generate = async (match: Match) => {
    if (!token) return;
    setError(null);
    setBusy('generate');
    setBusyId(match.id);
    try {
      const updated = await api.generateJobResume(token, match.id, apiKey.trim() || undefined);
      setMatches((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
      if (current?.id === updated.id) setCurrent(updated);
      recordActivity({ kind: 'rewrite', label: `Tailored resume for ${updated.company || updated.title}` });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not generate that resume.');
    } finally {
      setBusy(null);
      setBusyId(null);
    }
  };

  const download = async (match: Match) => {
    if (!token) return;
    setBusyId(match.id);
    try {
      const detail = await api.readJobMatch(token, match.id);
      if (!detail.optimized_resume) {
        setError('Generate the tailored resume first.');
        return;
      }
      const name = [match.company, match.title].filter(Boolean).join('-').replace(/\s+/g, '_');
      downloadText(`${name || 'tailored'}-resume.txt`, detail.optimized_resume);
    } catch {
      setError('Could not download that resume.');
    } finally {
      setBusyId(null);
    }
  };

  const rename = async (match: Match) => {
    if (!token) return;
    const nextCompany = window.prompt('Company', match.company);
    if (nextCompany === null) return;
    const nextTitle = window.prompt('Job role', match.title);
    if (nextTitle === null) return;

    setBusyId(match.id);
    try {
      const updated = await api.renameJobMatch(token, match.id, {
        company: nextCompany,
        title: nextTitle,
      });
      setMatches((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
      if (current?.id === updated.id) setCurrent(updated);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not update that job.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (match: Match) => {
    if (!token) return;
    if (!window.confirm(`Delete the match for ${match.company || match.title}?`)) return;
    setBusyId(match.id);
    try {
      await api.deleteJobMatch(token, match.id);
      setMatches((rows) => rows.filter((row) => row.id !== match.id));
      if (current?.id === match.id) setCurrent(null);
    } catch {
      setError('Could not delete that match.');
    } finally {
      setBusyId(null);
    }
  };

  const head = (
    <header className="jm-head">
      <div>
        <span className="eyebrow">Job Match</span>
        <h1>Tailor Your Resume for Every Job</h1>
        <p>Paste a job description, analyze the match, and generate an ATS-optimized resume.</p>
      </div>
      <Link className="btn btn-ghost" to="/dashboard/saved">
        <Briefcase size={16} /> Saved Resumes
      </Link>
    </header>
  );

  if (state === 'loading') {
    return (
      <>
        {head}
        <div className="card ov-placeholder">Loading…</div>
      </>
    );
  }

  if (state === 'error') {
    return (
      <>
        {head}
        <div className="card ov-placeholder ov-error">Could not load this page.</div>
      </>
    );
  }

  if (!analysis) {
    return (
      <>
        {head}
        <section className="card rw-empty">
          <span className="rw-empty-icon"><Briefcase size={22} /></span>
          <h2>Analyze a resume first</h2>
          <p>Job matching scores your analysed resume against a posting, so you need one on file.</p>
          <Link className="btn btn-primary" to="/dashboard/analysis">
            Go to Resume Analysis <ArrowRight />
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      {head}

      {error && <p className="form-alert" role="alert">{error}</p>}

      <div className="jm-top">
        <section className="card jm-panel">
          <h2>Job Description</h2>
          <p className="jm-sub">Paste the job description below. It is matched against your analysed resume.</p>

          <div className="jm-identity">
            <label className="form-field">
              <span>Company</span>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                disabled={busy !== null}
              />
            </label>
            <label className="form-field">
              <span>Job role</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior AI Engineer"
                disabled={busy !== null}
              />
            </label>
          </div>
          <p className="jm-identity-note">
            Optional — left blank, they're read from the posting where it states them.
          </p>

          <textarea
            className="jm-textarea"
            value={jd}
            onChange={(e) => setJd(e.target.value.slice(0, MAX_CHARS))}
            placeholder="We are looking for a Senior AI Engineer to join our team…"
            rows={14}
            disabled={busy !== null}
          />

          <div className="jm-count">
            <button type="button" className="ra-link" onClick={() => setJd(SAMPLE_JD)} disabled={busy !== null}>
              Use a sample JD
            </button>
            <span>{jd.length.toLocaleString()}/{MAX_CHARS.toLocaleString()} characters</span>
          </div>

          {config && !config.server_has_api_key && (
            <label className="form-field jm-key">
              <span>OpenAI API key</span>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…" autoComplete="off" />
            </label>
          )}

          <button
            type="button"
            className="btn btn-primary jm-analyze"
            onClick={analyze}
            disabled={busy !== null || jd.trim().length < MIN_CHARS}
          >
            {busy === 'analyze' ? 'Analyzing…' : 'Analyze Match'} <ArrowRight />
          </button>
        </section>

        <section className="card jm-panel">
          <div className="ov-card-head">
            <h2>Match Analysis</h2>
            <Link to="/dashboard/analysis">See full analysis <ArrowRight size={14} /></Link>
          </div>

          {!current ? (
            <p className="jm-none">
              <AlertCircle size={16} /> Paste a job description and run a match to see how your
              resume scores against it.
            </p>
          ) : (
            <>
              <div className="jm-summary">
                <Donut score={current.match_score} label="ATS Match" />
                <div className={`jm-verdict ${current.match_score >= 75 ? 'is-good' : 'is-mid'}`}>
                  <strong>
                    {current.match_score >= 75 ? 'Strong match!' : 'Good foundation!'}
                  </strong>
                  <p>
                    Your resume matches {current.match_score}% of the requirements for
                    {' '}{current.title || 'this role'}
                    {current.company && ` at ${current.company}`}.
                    {current.missing_skills.length > 0 &&
                      ` Generate a tailored resume to work in ${current.missing_skills.length} missing keyword${current.missing_skills.length === 1 ? '' : 's'}.`}
                  </p>
                </div>
              </div>

              <div className="jm-skills">
                <div>
                  <h3>Matching Skills</h3>
                  <div className="jm-chips">
                    {current.matching_skills.length === 0 && <span className="jm-muted">None scored 7+.</span>}
                    {current.matching_skills.map((skill) => (
                      <span key={skill} className="jm-chip is-good">{skill}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Missing Keywords</h3>
                  <div className="jm-chips">
                    {current.missing_skills.length === 0 && <span className="jm-muted">Nothing missing.</span>}
                    {current.missing_skills.map((skill) => (
                      <span key={skill} className="jm-chip is-weak">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="jm-role">
                <h3><FileText size={15} /> Role Summary</h3>
                <strong>{current.title || 'Role not stated'}</strong>
                <dl>
                  <div><dt>Experience</dt><dd>{current.role_summary.experience || '—'}</dd></div>
                  <div><dt>Type</dt><dd>{current.role_summary.employment_type || '—'}</dd></div>
                  <div><dt>Key Skills</dt><dd>{current.role_summary.key_skills.join(', ') || '—'}</dd></div>
                  <div><dt>Nice to Have</dt><dd>{current.role_summary.nice_to_have.join(', ') || '—'}</dd></div>
                </dl>
              </div>

              <div className="jm-generate">
                <span className="jm-generate-icon"><Sparkles size={18} /></span>
                <div>
                  <strong>Generate an Optimized Resume</strong>
                  <p>Tailors your resume for this job and works in the missing keywords.</p>
                </div>
                {current.has_optimized_resume && current.optimized_score !== null && (
                  <div className="jm-newscore">
                    <em>Re-scored</em>
                    <strong>{current.optimized_score}%</strong>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => generate(current)}
                  disabled={busy !== null}
                >
                  {busy === 'generate' && busyId === current.id
                    ? 'Generating…'
                    : current.has_optimized_resume
                      ? 'Regenerate'
                      : 'Generate Resume'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="card jm-list-panel">
        <div className="jm-list-head">
          <div>
            <h2>Your Job-Specific Resumes</h2>
            <p className="jm-sub">Each job keeps its own match and tailored resume.</p>
          </div>
          {matches.length > 0 && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs…"
              aria-label="Search jobs"
            />
          )}
        </div>

        {matches.length === 0 ? (
          <p className="jm-none">No job matches yet. Run one above to get started.</p>
        ) : visible.length === 0 ? (
          <p className="jm-none">No jobs match that search.</p>
        ) : (
          <ul className="jm-list">
            {visible.map((match) => (
              <li key={match.id} className={busyId === match.id ? 'is-busy' : ''}>
                <span className="jm-logo">{(match.company || match.title || '?').slice(0, 1).toUpperCase()}</span>

                <div className="jm-job">
                  <strong>{match.company || 'Company not stated'}</strong>
                  <em>{match.title || 'Role not stated'}</em>
                  <small>Matched {new Date(match.created_at).toLocaleDateString()}</small>
                </div>

                <div className="jm-job-score">
                  <Donut score={match.optimized_score ?? match.match_score} label={match.has_optimized_resume ? 'Optimized' : 'Match'} />
                </div>

                <div className="jm-job-skills">
                  <h4>Key Skills</h4>
                  <div className="jm-chips">
                    {match.role_summary.key_skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="jm-chip">{skill}</span>
                    ))}
                    {match.role_summary.key_skills.length === 0 && <span className="jm-muted">—</span>}
                  </div>
                </div>

                <div className="jm-job-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setCurrent(match)}>
                    <Eye size={15} /> View
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => download(match)}
                    disabled={!match.has_optimized_resume || busyId === match.id}
                    title={match.has_optimized_resume ? undefined : 'Generate the tailored resume first'}
                  >
                    <Download size={15} /> Download
                  </button>
                  <button
                    type="button"
                    className="jm-delete"
                    onClick={() => rename(match)}
                    aria-label={`Edit company and role for ${match.company || match.title || 'this job'}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button type="button" className="jm-delete" onClick={() => remove(match)} aria-label="Delete match">
                    <Trash size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
