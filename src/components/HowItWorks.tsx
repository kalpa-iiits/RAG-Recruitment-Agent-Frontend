import { ArrowRight, MessageSquare, Target, TrendUp, Upload } from './Icons';
import './HowItWorks.css';

const steps = [
  {
    icon: Upload,
    tone: 'red',
    title: '1. Upload Your Resume',
    body: 'Upload your resume (PDF or DOCX) in seconds.',
  },
  {
    icon: TrendUp,
    tone: 'purple',
    title: '2. Get AI Analysis',
    body: 'Receive your ATS score, skill gaps and personalized suggestions.',
  },
  {
    icon: MessageSquare,
    tone: 'green',
    title: '3. Practice & Improve',
    body: 'Generate interview questions and improve your resume with AI.',
  },
  {
    icon: Target,
    tone: 'amber',
    title: '4. Land More Interviews',
    body: 'Apply with confidence and get more interviews.',
  },
];

export default function HowItWorks() {
  return (
    <section className="section how" id="how">
      <div className="container">
        <div className="section-head">
          <h2>How CVExpert Works</h2>
          <p>Get from your resume to more interviews in 4 simple steps.</p>
        </div>

        <ol className="how-steps">
          {steps.map(({ icon: Icon, tone, title, body }, i) => (
            <li key={title}>
              <div className="how-step">
                <span className={`how-icon tone-${tone}`}><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
              {i < steps.length - 1 && <span className="how-arrow" aria-hidden><ArrowRight size={20} /></span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
