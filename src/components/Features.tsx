import { ArrowRight, Briefcase, FileText, MessageSquare, Sparkles } from './Icons';
import './Features.css';

const features = [
  {
    icon: FileText,
    tone: 'red',
    title: 'ATS Resume Score',
    body: 'Get a detailed ATS score out of 100 with keyword and skill-gap analysis.',
    href: '#ats-checker',
  },
  {
    icon: Sparkles,
    tone: 'purple',
    title: 'AI Resume Rewrite',
    body: 'Rewrite weak bullet points with action verbs and measurable results.',
    href: '#how',
  },
  {
    icon: MessageSquare,
    tone: 'green',
    title: 'Interview Preparation',
    body: 'Generate role-specific interview questions and practice answers with AI.',
    href: '#product',
  },
  {
    icon: Briefcase,
    tone: 'amber',
    title: 'Resume vs Job Description',
    body: 'Match your resume to any job description and see the missing keywords.',
    href: '#faq',
  },
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head">
          <h2>AI Resume Checker Features That Beat the ATS</h2>
          <p>Everything you need to build a resume that gets noticed and land more interviews.</p>
        </div>

        <div className="feature-grid">
          {features.map(({ icon: Icon, tone, title, body, href }) => (
            <article className="card feature" key={title}>
              <span className={`feature-icon tone-${tone}`}><Icon size={19} /></span>
              <h3>{title}</h3>
              <p>{body}</p>
              <a href={href} aria-label={`Learn more about ${title}`}>Learn more <ArrowRight size={14} /></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
