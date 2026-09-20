import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScoreGauge, SkillDonut, type DonutSlice } from '../components/dashboard/Charts';
import {
  AlertCircle,
  ArrowRight,
  BarChart,
  ChevronRight,
  FileText,
  HelpCircle,
  MessageSquare,
  Pencil,
  PenSquare,
  Upload,
  Users,
} from '../components/Icons';
import { useAuth } from '../auth/context';
import { displayName } from '../lib/identity';
import * as api from '../lib/api';
import type { AnalysisResult } from '../lib/api';
import { readActivity, timeAgo, type ActivityKind } from '../lib/activity';
import './Overview.css';

const ROLE_KEY = 'cvexpert-target-role';

const quickActions = [
  { to: '/dashboard/analysis', icon: FileText, tone: 'red', title: 'Analyze New Resume', body: 'Upload and analyze another resume' },
  { to: '/dashboard/qa', icon: HelpCircle, tone: 'blue', title: 'Ask AI About Your Resume', body: 'Get answers to specific questions' },
  { to: '/dashboard/interview', icon: MessageSquare, tone: 'amber', title: 'Generate Interview Questions', body: 'Practice with role-specific questions' },
  { to: '/dashboard/rewrite', icon: PenSquare, tone: 'purple', title: 'Create Improved Resume', body: 'Get an AI-optimized version' },
];

const activityIcon: Record<ActivityKind, typeof FileText> = {
  analysis: FileText,
  question: MessageSquare,
  interview: HelpCircle,
  rewrite: PenSquare,
};

/**
 * Buckets mirror the thresholds the backend scores against (agents.py):
 * strengths are >= 7 and missing_skills are <= 5.
 */
function bucket(scores: Record<string, number>) {
  const values = Object.values(scores);
  return {
    strong: values.filter((v) => v >= 7).length,
    moderate: values.filter((v) => v === 6).length,
    weak: values.filter((v) => v >= 1 && v <= 5).length,
    missing: values.filter((v) => v === 0).length,
    total: values.length,
  };
}

export default function Overview() {
  const { user, token } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<string>(() => {
    try {
      return localStorage.getItem(ROLE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [editingRole, setEditingRole] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([api.getAnalysis(token), api.getConfig(token).catch(() => null)])
      .then(([result, config]) => {
        if (cancelled) return;
        setAnalysis(result.result);
        if (config) setRoles(Object.keys(config.roles));
        setState('ready');
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Could not load your dashboard.');
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const activity = useMemo(() => readActivity(), []);

  const chooseRole = (role: string) => {
    setTargetRole(role);
    setEditingRole(false);
    try {
      if (role) localStorage.setItem(ROLE_KEY, role);
      else localStorage.removeItem(ROLE_KEY);
    } catch {
      /* storage unavailable — the choice just won't persist */
    }
  };

  const greeting = (
    <header className="ov-head">
      <h1>Welcome back, {displayName(user?.email)}! 👋</h1>
      <p>Here's your resume analysis overview.</p>
    </header>
  );

  if (state === 'loading') {
    return (
      <>
        {greeting}
        <div className="card ov-placeholder">Loading your analysis…</div>
      </>
    );
  }

  if (state === 'error') {
    return (
      <>
        {greeting}
        <div className="card ov-placeholder ov-error">{error}</div>
      </>
    );
  }

  const roleCard = (
    <section className="card ov-role">
      <div className="ov-card-head">
        <h2>Target Role</h2>
        {!editingRole && roles.length > 0 && (
          <button type="button" onClick={() => setEditingRole(true)} aria-label="Change target role">
            <Pencil />
          </button>
        )}
      </div>

      {editingRole ? (
        <select
          className="ov-role-select"
          value={targetRole}
          onChange={(e) => chooseRole(e.target.value)}
          autoFocus
        >
          <option value="">Not set</option>
          {roles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      ) : (
        <p className="ov-role-value">{targetRole || 'Not set'}</p>
      )}

      <button
        type="button"
        className="btn btn-ghost ov-role-change"
        onClick={() => setEditingRole((open) => !open)}
        disabled={roles.length === 0}
      >
        {editingRole ? 'Done' : 'Change Role'}
      </button>
    </section>
  );

  const quickActionsCard = (
    <section className="card ov-actions">
      <div className="ov-card-head"><h2>Quick Actions</h2></div>
      <ul>
        {quickActions.map(({ to, icon: Icon, tone, title, body }) => (
          <li key={to}>
            <Link to={to}>
              <span className={`ov-action-icon tone-${tone}`}><Icon size={18} /></span>
              <span className="ov-action-text">
                <strong>{title}</strong>
                <em>{body}</em>
              </span>
              <ChevronRight size={17} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );

  if (!analysis) {
    return (
      <>
        {greeting}
        <section className="card ov-empty">
          <span className="ov-empty-icon"><Upload size={22} /></span>
          <h2>No analysis yet</h2>
          <p>
            Upload a resume to get your ATS score, skill breakdown and improvement areas.
            Your latest analysis will appear here.
          </p>
          <Link className="btn btn-primary" to="/dashboard/analysis">
            Analyze My Resume <ArrowRight />
          </Link>
        </section>
        <div className="ov-grid-2">
          {roleCard}
          {quickActionsCard}
        </div>
      </>
    );
  }

  const counts = bucket(analysis.skill_scores);
  const matched = counts.total > 0 ? Math.round((counts.strong / counts.total) * 100) : 0;
  const topSkills = Object.entries(analysis.skill_scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const slices: DonutSlice[] = [
    { label: 'Strong', value: counts.strong, color: '#22b356' },
    { label: 'Moderate', value: counts.moderate, color: '#f5a524' },
    { label: 'Weak', value: counts.weak, color: '#ef4444' },
    { label: 'Missing', value: counts.missing, color: '#94a3b8' },
  ];

  return (
    <>
      {greeting}

      <div className="ov-stats">
        <section className="card ov-score">
          <div className="ov-gauge">
            <ScoreGauge score={analysis.overall_score} />
            <div className="ov-gauge-text">
              <strong>{analysis.overall_score}</strong>
              <span>/100</span>
              <em>ATS Score</em>
            </div>
          </div>
          <span className={`chip ${analysis.selected ? 'chip-green' : 'chip-red'}`}>
            {analysis.selected ? 'Good Match' : 'Needs Work'}
          </span>
        </section>

        <section className="card ov-stat">
          <span className="ov-stat-icon tone-blue"><Users /></span>
          <strong>{matched}%</strong>
          <span className="ov-stat-label">Skills Matched</span>
          <em className="ov-stat-note">{counts.strong} of {counts.total} at 7+</em>
        </section>

        <section className="card ov-stat">
          <span className="ov-stat-icon tone-green"><BarChart /></span>
          <strong>{analysis.strengths.length}</strong>
          <span className="ov-stat-label">Key Strengths</span>
          <em className="ov-stat-note ok">Great job!</em>
        </section>

        <section className="card ov-stat">
          <span className="ov-stat-icon tone-red"><AlertCircle size={18} /></span>
          <strong>{analysis.missing_skills.length}</strong>
          <span className="ov-stat-label">Areas to Improve</span>
          <em className="ov-stat-note warn">Needs attention</em>
        </section>
      </div>

      <div className="ov-grid-assessment">
        <section className="card ov-assessment">
          <div className="ov-card-head"><h2>Overall Assessment</h2></div>
          <p>{analysis.reasoning}</p>
          <Link className="btn btn-primary" to="/dashboard/analysis">
            View Detailed Analysis <ArrowRight />
          </Link>
        </section>
        {roleCard}
      </div>

      <div className="ov-grid-2">
        <section className="card ov-skills">
          <div className="ov-card-head">
            <h2>Skill Analysis</h2>
            <Link to="/dashboard/analysis">View Details <ArrowRight size={14} /></Link>
          </div>
          <div className="ov-skills-body">
            <SkillDonut slices={slices} center={analysis.overall_score} />
            <ul className="ov-legend">
              {slices.map((s) => (
                <li key={s.label}>
                  <i style={{ background: s.color }} />
                  {s.label} ({s.value})
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card ov-top">
          <div className="ov-card-head">
            <h2>Top Skills</h2>
            <Link to="/dashboard/analysis">View All <ArrowRight size={14} /></Link>
          </div>
          <ul>
            {topSkills.map(([skill, score]) => (
              <li key={skill}>
                <span className="ov-top-name">{skill}</span>
                <span className="ov-top-bar"><i style={{ width: `${score * 10}%` }} /></span>
                <span className="ov-top-score">{score}/10</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ov-grid-2">
        <section className="card ov-activity">
          <div className="ov-card-head"><h2>Recent Activity</h2></div>
          {activity.length === 0 ? (
            <p className="ov-muted">
              No activity yet. Actions you take in the dashboard will be listed here.
            </p>
          ) : (
            <ul>
              {activity.slice(0, 4).map((entry) => {
                const Icon = activityIcon[entry.kind];
                return (
                  <li key={`${entry.kind}-${entry.at}`}>
                    <span className="ov-activity-icon"><Icon size={17} /></span>
                    <span className="ov-activity-text">
                      <strong>{entry.label}</strong>
                      <em>{timeAgo(entry.at)}</em>
                    </span>
                    {entry.badge && <span className="chip chip-green">{entry.badge}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {quickActionsCard}
      </div>
    </>
  );
}
