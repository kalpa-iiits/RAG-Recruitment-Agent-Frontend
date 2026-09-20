import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from '../components/Icons';
import { useAuth } from '../auth/context';
import * as api from '../lib/api';
import { ApiError, type AnalysisResult, type AppConfig, type InterviewQuestion } from '../lib/api';
import { recordActivity } from '../lib/activity';
import './InterviewPrep.css';

const ROLE_KEY = 'cvexpert-target-role';
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const COUNTS = [3, 5, 8, 10, 15];

function readRole(): string {
  try {
    return localStorage.getItem(ROLE_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function InterviewPrep() {
  const { token } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [role, setRole] = useState(readRole);
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(5);
  const [types, setTypes] = useState<string[]>(['Technical']);
  const [focusSkills, setFocusSkills] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [seniority, setSeniority] = useState('');
  const [apiKey, setApiKey] = useState('');

  /** What the visible set was generated with, so drift from the controls shows. */
  const [generatedWith, setGeneratedWith] = useState<{
    types: string[];
    difficulty: string;
    count: number;
    topics: string[];
    seniority: string;
  } | null>(null);

  const [index, setIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  /** A question counts as practised once its answer has been revealed. */
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      api.getAnalysis(token),
      api.getConfig(token).catch(() => null),
      api.getCachedInterviewQuestions(token).catch(() => null),
    ])
      .then(([result, cfg, cached]) => {
        if (cancelled) return;
        setAnalysis(result);
        setConfig(cfg);
        setQuestions(cached);
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

  const roleTopics = useMemo(
    () => (role ? (config?.role_topics?.[role] ?? []) : []),
    [config, role],
  );
  const commonTopics = config?.common_topics ?? [];
  const seniorityLevels = Object.entries(config?.seniority_levels ?? {});

  const skills = useMemo(
    () => (analysis ? Object.entries(analysis.skill_scores).sort((a, b) => b[1] - a[1]) : []),
    [analysis],
  );

  /** The three lowest-scoring skills — what the analysis says to work on. */
  const weakest = useMemo(() => skills.slice(-3).map(([name]) => name).reverse(), [skills]);

  /** Counts per field in the returned set — proof the request was honoured. */
  const { typeComposition, topicComposition } = useMemo(() => {
    const tally = (pick: (q: InterviewQuestion) => string): [string, number][] => {
      if (!questions?.length) return [];
      const counts = new Map<string, number>();
      for (const q of questions) {
        const key = pick(q);
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    };
    return {
      typeComposition: tally((q) => q.type),
      topicComposition: tally((q) => q.topic),
    };
  }, [questions]);

  const sameSet = (a: string[], b: string[]) =>
    a.length === b.length && a.every((v) => b.includes(v));

  const selectionChanged =
    generatedWith !== null &&
    (generatedWith.difficulty !== difficulty ||
      generatedWith.count !== count ||
      generatedWith.seniority !== seniority ||
      !sameSet(generatedWith.types, types) ||
      !sameSet(generatedWith.topics, topics));

  const chooseRole = (next: string) => {
    setRole(next);
    try {
      if (next) localStorage.setItem(ROLE_KEY, next);
      else localStorage.removeItem(ROLE_KEY);
    } catch {
      /* storage unavailable */
    }
  };

  /**
   * Functional update, not a closure read — two clicks landing in the same
   * render batch would otherwise overwrite each other.
   */
  const toggle = (set: Dispatch<SetStateAction<string[]>>, value: string) =>
    set((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]));

  const generate = async () => {
    if (!token || types.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const result = await api.generateInterviewQuestions(token, {
        questionTypes: types,
        difficulty,
        numQuestions: count,
        focusSkills,
        topics,
        seniority,
        targetRole: role,
        apiKey: apiKey.trim() || undefined,
      });
      setQuestions(result);
      setGeneratedWith({ types, difficulty, count, topics, seniority });
      setIndex(0);
      setShowHint(false);
      setShowAnswer(false);
      setCompleted(new Set());
      recordActivity({
        kind: 'interview',
        label: `Generated ${result.length} interview questions`,
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not generate questions.');
    } finally {
      setBusy(false);
    }
  };

  const go = (step: number) => {
    if (!questions) return;
    setIndex((i) => (i + step + questions.length) % questions.length);
    setShowHint(false);
    setShowAnswer(false);
  };

  const reveal = () => {
    setShowAnswer(true);
    setCompleted((done) => new Set(done).add(index));
  };

  const head = (
    <header className="ip-head">
      <span className="eyebrow">Interview Preparation</span>
      <h1>Practice with Questions Tailored to Your Skills</h1>
      <p>Get AI-generated interview questions based on your resume analysis, skill gaps and target role.</p>
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
          <p>Questions are generated from your analysed resume and the skills it scored.</p>
          <Link className="btn btn-primary" to="/dashboard/analysis">
            Go to Resume Analysis <ArrowRight />
          </Link>
        </section>
      </>
    );
  }

  const current = questions?.[index];
  const total = questions?.length ?? 0;
  const done = completed.size;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <>
      {head}

      <div className="ip-controls">
        <label className="ip-control">
          <span>Target Role</span>
          <select value={role} onChange={(e) => chooseRole(e.target.value)} disabled={busy}>
            <option value="">Not set</option>
            {Object.keys(config?.roles ?? {}).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label className="ip-control">
          <span>Difficulty</span>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={busy}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label className="ip-control">
          <span>Level</span>
          <select value={seniority} onChange={(e) => setSeniority(e.target.value)} disabled={busy}>
            <option value="">Any level</option>
            {seniorityLevels.map(([level]) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>

        <label className="ip-control">
          <span>Number of Questions</span>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} disabled={busy}>
            {COUNTS.map((c) => (
              <option key={c} value={c}>{c} Questions</option>
            ))}
          </select>
        </label>

        <button type="button" className="btn btn-primary ip-generate" onClick={generate} disabled={busy || types.length === 0}>
          <Sparkles size={17} /> {busy ? 'Generating…' : 'Generate Questions'}
        </button>
      </div>

      <div className="ip-types">
        <span>Question types</span>
        {(config?.question_types ?? []).map((type) => (
          <button
            key={type}
            type="button"
            className={types.includes(type) ? 'is-on' : ''}
            onClick={() => toggle(setTypes, type)}
            disabled={busy}
          >
            {type}
          </button>
        ))}
      </div>

      {(roleTopics.length > 0 || commonTopics.length > 0) && (
        <div className="ip-topics">
          <div className="ip-topics-head">
            <span>Topics to cover</span>
            <span className="ip-topics-hint">
              {topics.length === 0
                ? role
                  ? `None selected — the whole ${role} catalogue is used.`
                  : 'Pick a target role above to see role-specific topics.'
                : `${topics.length} selected`}
            </span>
            {topics.length > 0 && (
              <button type="button" className="ra-link" onClick={() => setTopics([])}>
                Clear
              </button>
            )}
          </div>

          {roleTopics.length > 0 && (
            <div className="ip-topic-group">
              <h4>{role}</h4>
              <div className="ip-topic-chips">
                {roleTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={topics.includes(topic) ? 'is-on' : ''}
                    onClick={() => toggle(setTopics, topic)}
                    disabled={busy}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ip-topic-group">
            <h4>About you</h4>
            <div className="ip-topic-chips">
              {commonTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={topics.includes(topic) ? 'is-on' : ''}
                  onClick={() => toggle(setTopics, topic)}
                  disabled={busy}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {config && !config.server_has_api_key && (
        <label className="form-field ip-key">
          <span>OpenAI API key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
            disabled={busy}
          />
        </label>
      )}

      {error && <p className="form-alert" role="alert">{error}</p>}
      {types.length === 0 && <p className="ip-note">Pick at least one question type.</p>}
      {selectionChanged && (
        <p className="ip-stale">
          These settings differ from the set below — generate again to apply them.
        </p>
      )}

      <div className="ip-grid">
        {current ? (
          <section className="card ip-question">
            <header>
              <div>
                <h2>Question {index + 1} of {total}</h2>
                {typeComposition.length > 0 && (
                  <p className="ip-composition">
                    {typeComposition.map(([type, n]) => `${type} ${n}`).join(' · ')}
                  </p>
                )}
                {topicComposition.length > 0 && (
                  <p className="ip-composition ip-composition-topics">
                    {topicComposition.map(([topic, n]) => `${topic} ${n}`).join(' · ')}
                  </p>
                )}
              </div>
              <div className="ip-nav">
                <button type="button" onClick={() => go(-1)} aria-label="Previous question">
                  <ChevronLeft />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next question">
                  <ChevronRight />
                </button>
              </div>
            </header>

            <div className="ip-chips">
              {current.topic && <span className="tag tag-green">{current.topic}</span>}
              {current.skill && <span className="tag tag-blue">{current.skill}</span>}
              <span className="tag tag-amber">{current.difficulty ?? difficulty}</span>
              <span className="tag tag-plain">{current.type}</span>
            </div>

            <h3>{current.question}</h3>

            {showAnswer && (
              <div className="ip-answer">
                <h4><FileText size={16} /> Expected Answer</h4>
                {current.expected_answer ? (
                  <p>{current.expected_answer}</p>
                ) : (
                  <p className="ip-note">
                    The model didn't return an expected answer for this question.
                  </p>
                )}
              </div>
            )}

            {showHint && !showAnswer && (
              <div className="ip-hint">
                <h4><Eye size={16} /> Hint</h4>
                <p>{current.hint || 'No hint was returned for this question.'}</p>
              </div>
            )}

            <footer>
              <button type="button" className="btn btn-ghost" onClick={() => setShowHint((v) => !v)}>
                <Eye size={16} /> {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={reveal}>
                <ShieldCheck size={16} /> Reveal Answer
              </button>
              <button type="button" className="btn btn-primary" onClick={() => go(1)}>
                Next Question <ArrowRight />
              </button>
            </footer>
          </section>
        ) : (
          <section className="card ip-empty">
            <span className="rw-empty-icon"><MessageSquare size={22} /></span>
            <h2>No questions yet</h2>
            <p>
              Choose your difficulty and question types above, optionally narrow the skills, then
              generate a set to practise with.
            </p>
          </section>
        )}

        <aside className="ip-aside">
          <section className="card ip-readiness">
            <h2>Interview Readiness</h2>
            <div className="ip-readiness-body">
              <div className="ip-ring">
                <svg viewBox="0 0 120 120" role="img" aria-label={`${done} of ${total} questions practised`}>
                  <circle cx="60" cy="60" r="46" fill="none" stroke="var(--line)" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="46" fill="none" stroke="var(--brand)" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(2 * Math.PI * 46 * percent) / 100} ${2 * Math.PI * 46}`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <span>
                  <strong>{done}/{total || 0}</strong>
                  <em>{percent}%</em>
                </span>
              </div>
              <div>
                <strong className="ip-readiness-title">
                  {total === 0 ? 'Not started' : done === total ? 'All done!' : 'Keep going!'}
                </strong>
                <p>
                  {total === 0
                    ? 'Generate a set to start practising.'
                    : `You've revealed ${done} of ${total} answers.`}
                </p>
              </div>
            </div>
          </section>

          <section className="card ip-skills">
            <div className="ov-card-head">
              <h2>Skills from Your Resume</h2>
              <Link to="/dashboard/analysis">View Full Analysis <ArrowRight size={14} /></Link>
            </div>
            <p className="ip-skills-sub">
              Select skills to target. With none selected, every analysed skill is used.
            </p>
            <ul>
              {skills.map(([skill, score]) => (
                <li key={skill}>
                  <label>
                    <input
                      type="checkbox"
                      checked={focusSkills.includes(skill)}
                      onChange={() => toggle(setFocusSkills, skill)}
                      disabled={busy}
                    />
                    <span className="ip-skill-name">{skill}</span>
                  </label>
                  <span className="ip-skill-bar">
                    <i
                      className={score >= 7 ? 'is-high' : score === 6 ? 'is-mid' : 'is-low'}
                      style={{ width: `${score * 10}%` }}
                    />
                  </span>
                  <span className="ip-skill-score">{score}/10</span>
                </li>
              ))}
            </ul>
          </section>

          {weakest.length > 0 && (
            <section className="card ip-reco">
              <h3><Sparkles size={16} /> AI Recommendation</h3>
              <p>
                Focus on {weakest.join(', ')} — your lowest scores in this analysis.
              </p>
              <button type="button" className="ra-link" onClick={() => setFocusSkills(weakest)}>
                Target these skills <ArrowRight size={14} />
              </button>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
