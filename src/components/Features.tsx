import { ArrowRight, Briefcase, FileText, MessageSquare, Sparkles } from './Icons';
import './Features.css';

const features = [
  {
    icon: FileText,
    tone: 'red',
    title: 'ATS Analysis',
    body: 'Get detailed ATS scores and skill-gap analysis.',
  },
  {
    icon: Sparkles,
    tone: 'purple',
    title: 'AI Resume Rewrite',
    body: 'Improve your resume with AI-powered suggestions.',
  },
  {
    icon: MessageSquare,
    tone: 'green',
    title: 'Interview Preparation',
    body: 'Generate role-specific questions and practice with AI.',
  },
  {
    icon: Briefcase,
    tone: 'amber',
    title: 'Job Match Analysis',
    body: 'Match your resume with any job description.',
  },
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head">
          <h2>Powerful Features for Your Career Growth</h2>
          <p>Everything you need to build a resume that gets noticed and land more interviews.</p>
        </div>

        <div className="feature-grid">
          {features.map(({ icon: Icon, tone, title, body }) => (
            <article className="card feature" key={title}>
              <span className={`feature-icon tone-${tone}`}><Icon size={19} /></span>
              <h3>{title}</h3>
              <p>{body}</p>
              <a href="#learn-more">Learn more <ArrowRight size={14} /></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
