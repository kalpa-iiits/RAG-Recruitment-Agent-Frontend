import { AlertCircle, Bookmark, FileText, Home, Logo, MessageSquare, Sparkles, Target, TrendUp } from './Icons';
import './DashboardMock.css';

const navItems = [
  { label: 'Overview', icon: Home, active: true },
  { label: 'Resume Analysis', icon: FileText },
  { label: 'AI Rewrite', icon: Sparkles },
  { label: 'Interview Questions', icon: MessageSquare },
  { label: 'Job Match', icon: Target },
  { label: 'Saved Resumes', icon: Bookmark },
];

const skills = [
  { name: 'Python', score: 9 },
  { name: 'Machine Learning', score: 8 },
  { name: 'FastAPI', score: 8 },
  { name: 'System Design', score: 7 },
  { name: 'AWS', score: 7 },
];

const SCORE = 78;
const R = 46;
const CIRC = 2 * Math.PI * R;
const ARC = CIRC * 0.75; // 270° gauge, gap at the bottom

function Gauge() {
  return (
    <svg className="gauge" viewBox="0 0 120 120" role="img" aria-label={`ATS score ${SCORE} out of 100`}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <circle
        cx="60" cy="60" r={R} fill="none" stroke="var(--line)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${ARC} ${CIRC}`} transform="rotate(135 60 60)"
      />
      <circle
        cx="60" cy="60" r={R} fill="none" stroke="url(#gaugeGrad)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${ARC * (SCORE / 100)} ${CIRC}`} transform="rotate(135 60 60)"
      />
    </svg>
  );
}

export default function DashboardMock() {
  return (
    <div className="dash" aria-hidden>
      <div className="dash-topbar">
        <span className="dash-logo"><Logo size={18} /> CVExpert</span>
        <span className="dash-status"><i /> Analysis completed</span>
      </div>

      <div className="dash-body">
        <aside className="dash-side">
          {navItems.map(({ label, icon: Icon, active }) => (
            <span key={label} className={`dash-navitem ${active ? 'is-active' : ''}`}>
              <Icon />
              {label}
            </span>
          ))}
        </aside>

        <div className="dash-main">
          <div className="dash-row">
            <div className="dash-card dash-score">
              <h4>ATS Score</h4>
              <div className="gauge-wrap">
                <Gauge />
                <div className="gauge-value">
                  <strong>{SCORE}</strong>
                  <span>/100</span>
                </div>
              </div>
              <span className="chip chip-green">Good Match</span>
              <p>You're stronger than<br />72% of applicants.</p>
            </div>

            <div className="dash-card dash-skills">
              <h4>Top Skills</h4>
              <ul>
                {skills.map((s) => (
                  <li key={s.name}>
                    <span className="skill-name">{s.name}</span>
                    <span className="skill-bar"><i style={{ width: `${s.score * 10}%` }} /></span>
                    <span className="skill-score">{s.score}/10</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="dash-row dash-stats">
            <div className="dash-card stat">
              <span className="stat-icon blue"><FileText size={14} /></span>
              <strong>5</strong>
              <span className="stat-label">Key Strengths</span>
            </div>
            <div className="dash-card stat">
              <span className="stat-icon red"><AlertCircle size={14} /></span>
              <strong>7</strong>
              <span className="stat-label">Areas to Improve</span>
            </div>
            <div className="dash-card stat">
              <span className="stat-icon green"><TrendUp size={14} /></span>
              <strong>92%</strong>
              <span className="stat-label">Recruiter Match</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
