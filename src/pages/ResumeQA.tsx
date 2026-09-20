import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart,
  Briefcase,
  ChevronRight,
  FileText,
  MessageSquare,
  Pencil,
  Sparkles,
  Target,
} from '../components/Icons';
import { ScoreGauge } from '../components/dashboard/Charts';
import { useAuth } from '../auth/context';
import { displayName, initials } from '../lib/identity';
import * as api from '../lib/api';
import { ApiError, type AnalysisResult, type AppConfig, type QaMessage } from '../lib/api';
import { recordActivity } from '../lib/activity';
import './ResumeQA.css';

const ROLE_KEY = 'cvexpert-target-role';

function readRole(): string {
  try {
    return localStorage.getItem(ROLE_KEY) ?? '';
  } catch {
    return '';
  }
}

function clockTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ResumeQA() {
  const { user, token } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [history, setHistory] = useState<QaMessage[]>([]);

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [role, setRole] = useState(readRole);
  const [editingRole, setEditingRole] = useState(false);

  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      api.getAnalysis(token),
      api.getConfig(token).catch(() => null),
      api.getQaHistory(token).catch(() => []),
    ])
      .then(([result, cfg, messages]) => {
        if (cancelled) return;
        setAnalysis(result);
        setConfig(cfg);
        setHistory(messages);
        setState('ready');
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Could not load your analysis.');
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [history, pending]);

  const skills = useMemo(
    () => (analysis ? Object.entries(analysis.skill_scores).sort((a, b) => b[1] - a[1]) : []),
    [analysis],
  );
  const topSkills = skills.slice(0, 6).map(([name]) => name);
  const focusAreas = analysis?.missing_skills.slice(0, 5) ?? [];

  const suggestions = useMemo(() => {
    const base = [
      'What are my weaknesses?',
      'How can I improve my resume?',
      role ? `Am I a good fit for ${role} roles?` : 'What roles am I a good fit for?',
      'Suggest projects I can add',
    ];
    // One suggestion grounded in the actual analysis.
    const weakest = skills.at(-1);
    if (weakest) base.push(`How do I strengthen my ${weakest[0]} experience?`);
    return base;
  }, [role, skills]);

  const chooseRole = (next: string) => {
    setRole(next);
    setEditingRole(false);
    try {
      if (next) localStorage.setItem(ROLE_KEY, next);
      else localStorage.removeItem(ROLE_KEY);
    } catch {
      /* storage unavailable */
    }
  };

  const send = async (question: string) => {
    const text = question.trim();
    if (!token || !text || pending) return;

    setError(null);
    setDraft('');
    setPending(text);
    try {
      const answer = await api.ask(token, text, apiKey.trim() || undefined);
      const at = new Date().toISOString();
      setHistory((current) => [
        ...current,
        { role: 'user', content: text, at },
        { role: 'assistant', content: answer, at },
      ]);
      recordActivity({ kind: 'question', label: 'Asked a question about your resume' });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not get an answer.');
    } finally {
      setPending(null);
    }
  };

  const clearChat = async () => {
    if (!token) return;
    try {
      await api.clearQaHistory(token);
      setHistory([]);
    } catch {
      setError('Could not clear the conversation.');
    }
  };

  const head = (
    <header className="qa-head">
      <span className="eyebrow">Resume AI Assistant</span>
      <h1>Ask AI About Your Resume</h1>
      <p>Get detailed answers about your resume, skills, experience and career advice. Powered by your resume analysis.</p>
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
        <div className="card ov-placeholder ov-error">{error}</div>
      </>
    );
  }

  if (!analysis) {
    return (
      <>
        {head}
        <section className="card rw-empty">
          <span className="rw-empty-icon"><MessageSquare size={22} /></span>
          <h2>Analyze a resume first</h2>
          <p>Answers are drawn from your analysed resume, so upload one to start the conversation.</p>
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

      <div className="qa-strip">
        <section className="card qa-score">
          <div className="qa-gauge">
            <ScoreGauge score={analysis.overall_score} />
            <span><strong>{analysis.overall_score}</strong>/100</span>
          </div>
          <div>
            <em>ATS Score</em>
            <span className={`chip ${analysis.selected ? 'chip-green' : 'chip-red'}`}>
              {analysis.selected ? 'Good Match' : 'Needs Work'}
            </span>
          </div>
        </section>

        <section className="card qa-fact">
          <span className="qa-fact-icon tone-red"><Briefcase size={17} /></span>
          <div>
            <em>Target Role</em>
            {editingRole ? (
              <select
                className="qa-role-select"
                value={role}
                onChange={(e) => chooseRole(e.target.value)}
                autoFocus
              >
                <option value="">Not set</option>
                {Object.keys(config?.roles ?? {}).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ) : (
              <>
                <strong>{role || 'Not set'}</strong>
                <button type="button" className="qa-edit" onClick={() => setEditingRole(true)}>
                  Edit Role <Pencil size={13} />
                </button>
              </>
            )}
          </div>
        </section>

        <section className="card qa-fact">
          <span className="qa-fact-icon tone-green"><BarChart size={17} /></span>
          <div>
            <em>Top Skills</em>
            <strong>{topSkills.slice(0, 4).join(', ') || '—'}</strong>
          </div>
        </section>

        <section className="card qa-fact">
          <span className="qa-fact-icon tone-purple"><Target size={17} /></span>
          <div>
            <em>Focus Areas</em>
            <strong>{focusAreas.slice(0, 3).join(', ') || 'None'}</strong>
          </div>
        </section>
      </div>

      <div className="qa-grid">
        <section className="card qa-chat">
          <div className="qa-transcript" ref={transcriptRef}>
            <div className="qa-msg is-ai">
              <span className="qa-avatar is-ai"><Sparkles size={15} /></span>
              <div className="qa-bubble">
                <p><strong>Hi {displayName(user?.email)}! 👋</strong></p>
                <p>
                  I can answer questions about your resume, help you understand your analysis,
                  and provide career advice. What would you like to know?
                </p>
              </div>
            </div>

            {history.map((message, i) => (
              <div key={`${message.at}-${i}`} className={`qa-msg ${message.role === 'user' ? 'is-user' : 'is-ai'}`}>
                {message.role === 'assistant' && (
                  <span className="qa-avatar is-ai"><Sparkles size={15} /></span>
                )}
                <div className="qa-bubble">
                  <p>{message.content}</p>
                  <time>{clockTime(message.at)}</time>
                </div>
                {message.role === 'user' && (
                  <span className="qa-avatar is-user">
                    {initials(user?.email)}
                  </span>
                )}
              </div>
            ))}

            {pending && (
              <>
                <div className="qa-msg is-user">
                  <div className="qa-bubble"><p>{pending}</p></div>
                  <span className="qa-avatar is-user">
                    {initials(user?.email)}
                  </span>
                </div>
                <div className="qa-msg is-ai">
                  <span className="qa-avatar is-ai"><Sparkles size={15} /></span>
                  <div className="qa-bubble qa-typing"><i /><i /><i /></div>
                </div>
              </>
            )}
          </div>

          {error && <p className="form-alert qa-alert" role="alert">{error}</p>}

          {config && !config.server_has_api_key && (
            <label className="form-field qa-key">
              <span>OpenAI API key</span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                autoComplete="off"
              />
            </label>
          )}

          <form
            className="qa-composer"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about your resume, ATS score, career growth, or interview preparation…"
              disabled={!!pending}
            />
            <button type="submit" className="btn btn-primary" disabled={!!pending || !draft.trim()}>
              {pending ? 'Thinking…' : 'Send'}
            </button>
          </form>

          {history.length > 0 && (
            <button type="button" className="ra-link qa-clear" onClick={clearChat}>
              Clear conversation
            </button>
          )}
        </section>

        <aside className="qa-aside">
          <section className="card qa-panel">
            <div className="ov-card-head">
              <h2>Resume Snapshot</h2>
              <Link to="/dashboard/analysis">View Full Analysis <ArrowRight size={14} /></Link>
            </div>
            <dl className="qa-snapshot">
              <div>
                <dt>ATS Score</dt>
                <dd>
                  <strong>{analysis.overall_score}</strong>/100
                  <span className={`chip ${analysis.selected ? 'chip-green' : 'chip-red'}`}>
                    {analysis.selected ? 'Good Match' : 'Needs Work'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Skills Evaluated</dt>
                <dd><strong>{skills.length}</strong></dd>
              </div>
              <div>
                <dt>Target Role</dt>
                <dd><strong>{role || 'Not set'}</strong></dd>
              </div>
            </dl>
          </section>

          <section className="card qa-panel">
            <div className="ov-card-head">
              <h2>Top Skills</h2>
              <Link to="/dashboard/analysis">View All <ArrowRight size={14} /></Link>
            </div>
            <div className="qa-chips">
              {topSkills.length === 0 && <span className="ra-muted">None scored yet.</span>}
              {topSkills.map((skill) => (
                <span key={skill} className="qa-chip is-good">{skill}</span>
              ))}
            </div>
          </section>

          <section className="card qa-panel">
            <div className="ov-card-head">
              <h2>Improvement Areas</h2>
              <Link to="/dashboard/analysis">View All <ArrowRight size={14} /></Link>
            </div>
            <div className="qa-chips">
              {analysis.missing_skills.length === 0 && (
                <span className="ra-muted">Nothing scored at or below 5.</span>
              )}
              {analysis.missing_skills.slice(0, 8).map((skill) => (
                <span key={skill} className="qa-chip is-weak">{skill}</span>
              ))}
            </div>
          </section>

          <section className="card qa-panel">
            <h2 className="qa-suggest-title">Suggested Questions</h2>
            <ul className="qa-suggestions">
              {suggestions.map((question) => (
                <li key={question}>
                  <button type="button" onClick={() => send(question)} disabled={!!pending}>
                    <FileText size={15} />
                    <span>{question}</span>
                    <ChevronRight size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
