import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from './Icons';
import './AtsGuide.css';

const checks = [
  {
    title: 'Keyword match',
    body: 'Compares your skills and job titles with the words recruiters search for in the ATS, and lists the ones you are missing.',
  },
  {
    title: 'ATS-friendly formatting',
    body: 'Flags tables, columns, headers, icons and images that make applicant tracking systems misread a resume.',
  },
  {
    title: 'Section structure',
    body: 'Checks for standard headings (Summary, Experience, Skills, Education) so each section is parsed into the right field.',
  },
  {
    title: 'Impact of bullet points',
    body: 'Spots weak, duty-only bullets and rewrites them with action verbs and measurable results.',
  },
  {
    title: 'Job description fit',
    body: 'Scores your resume against a specific job posting so you can tailor it before you apply.',
  },
  {
    title: 'Skill gaps',
    body: 'Shows which hard and soft skills the role expects that your resume does not yet prove.',
  },
];

export default function AtsGuide() {
  return (
    <section className="section ats" id="ats-checker">
      <div className="container ats-grid">
        <div className="ats-copy">
          <span className="eyebrow">Free ATS resume checker</span>
          <h2>What is an ATS score, and how do you improve it?</h2>
          <p>
            Most companies run applications through an applicant tracking system (ATS) such as Workday,
            Greenhouse, Lever or Taleo. The ATS parses your resume into fields, and recruiters then search
            those fields by keyword. If the parser cannot read your resume, or your resume lacks the terms
            in the job description, it rarely reaches a human.
          </p>
          <p>
            Your <strong>ATS score</strong> estimates how well your resume survives that process — how
            cleanly it parses and how closely it matches the role. CVExpert checks your resume the way an
            ATS does, gives you a score out of 100, and tells you exactly what to fix.
          </p>
          <Link className="btn btn-primary" to="/login?tab=signup">
            Check My ATS Score Free <ArrowRight />
          </Link>
        </div>

        <div className="ats-checks">
          <h3>What our resume checker looks at</h3>
          <ul>
            {checks.map((c) => (
              <li key={c.title}>
                <CheckCircle size={18} />
                <span>
                  <strong>{c.title}</strong>
                  {c.body}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
