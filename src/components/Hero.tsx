import { Link } from 'react-router-dom';
import { BadgeCheck, CardIcon, CheckCircle, Play, Rocket, ShieldCheck, Sparks, Upload } from './Icons';
import DashboardMock from './DashboardMock';
import './Hero.css';

const highlights = ['ATS Analysis', 'Resume Rewrite', 'Interview Questions', 'Job Match'];

const trust = [
  { icon: CardIcon, label: 'No credit card required' },
  { icon: BadgeCheck, label: 'Trusted by 10,000+ job seekers' },
  { icon: ShieldCheck, label: 'GDPR compliant' },
];

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="hero-badge"><Rocket size={14} /> AI-Powered Career Growth</span>

          <h1>
            Land More
            <br />
            <span className="accent">Interviews.</span>
          </h1>

          <p className="hero-sub">
            Get recruiter-grade ATS analysis, AI resume improvements,{' '}
            <br />
            interview questions and job matching — in under 60 seconds.
          </p>

          <ul className="hero-highlights">
            {highlights.map((h) => (
              <li key={h}>
                <CheckCircle size={16} />
                {h}
              </li>
            ))}
          </ul>

          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" to="/login?tab=signup"><Upload /> Analyze My Resume</Link>
            <a className="btn btn-ghost btn-lg" href="#sample"><Play /> View Sample Report</a>
          </div>

          <ul className="hero-trust">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label}><Icon /> {label}</li>
            ))}
          </ul>
        </div>

        <div className="hero-visual">
          <div className="hero-note">
            <span>Turn your resume into opportunities</span>
            <svg viewBox="0 0 84 74" fill="none" aria-hidden>
              <path d="M72 4C74 26 64 44 40 54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M50 50.5 38.5 55.5 47 64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <DashboardMock />
          <Sparks className="hero-sparks" />
        </div>
      </div>
    </section>
  );
}
