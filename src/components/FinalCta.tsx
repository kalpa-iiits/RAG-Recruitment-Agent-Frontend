import { Link } from 'react-router-dom';
import { Play, Sparks, Upload } from './Icons';
import './FinalCta.css';

export default function FinalCta() {
  return (
    <section className="finalcta" id="get-started">
      <div className="container finalcta-inner">
        <div>
          <span className="eyebrow">Your next opportunity is closer</span>
          <h2>Ready to Land More Interviews?</h2>
          <p>Upload your resume and get your ATS score in under 60 seconds.</p>
        </div>

        <div className="finalcta-actions">
          <Link className="btn btn-primary btn-lg" to="/login?tab=signup"><Upload /> Analyze My Resume</Link>
          <a className="btn btn-ghost btn-lg" href="#sample"><Play /> View Sample Report</a>
        </div>
      </div>
      <Sparks className="finalcta-sparks" />
    </section>
  );
}
