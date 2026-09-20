import { Amazon, Google, Microsoft } from './BrandLogos';
import './Testimonials.css';

const testimonials = [
  {
    quote: 'Increased my ATS score from 62 to 91 and got interview calls within two weeks. CVExpert is a game changer!',
    name: 'Rahul S.',
    role: 'Software Engineer at Google',
    initials: 'RS',
    tone: 'blue',
    logo: Google,
    logoSize: 14,
  },
  {
    quote: 'CVExpert helped me prepare for interviews with role-specific questions. I received 3 interview calls in a month!',
    name: 'Priya M.',
    role: 'ML Engineer at Amazon',
    initials: 'PM',
    tone: 'red',
    logo: Amazon,
    logoSize: 12,
  },
  {
    quote: 'The AI feedback and resume rewrite suggestions were spot on. I felt much more confident going into interviews.',
    name: 'Aman K.',
    role: 'Backend Engineer at Microsoft',
    initials: 'AK',
    tone: 'green',
    logo: Microsoft,
    logoSize: 11,
  },
];

export default function Testimonials() {
  return (
    <section className="section" id="stories">
      <div className="section-head">
        <h2>Real People. Real Results.</h2>
      </div>
      <div className="container tm-grid">
        {testimonials.map((t) => (
          <figure className="card tm" key={t.name}>
            <div className="tm-top">
              <span className={`tm-avatar tone-${t.tone}`}>{t.initials}</span>
              <blockquote>"{t.quote}"</blockquote>
            </div>
            <figcaption>
              <span className="tm-logo"><t.logo size={t.logoSize} /></span>
              <span>
                <strong>{t.name}</strong>
                <em>{t.role}</em>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
