import { useState } from 'react';
import { ChevronDown } from './Icons';
import '../pages/PricingPage.css';

// Phrased the way people search, so each question can answer a real query.
const faqs = [
  {
    q: 'What is a good ATS score for a resume?',
    a: 'Aim for 80 or above out of 100. A score in that range usually means your resume parses cleanly and matches most of the keywords in the job description. Below 60, the resume is likely being filtered out before a recruiter sees it.',
  },
  {
    q: 'Is the ATS resume checker free?',
    a: 'Yes. The Free plan includes one full resume analysis with an ATS score every month, plus limited AI Q&A and interview questions. No credit card is required.',
  },
  {
    q: 'How do I make my resume ATS friendly?',
    a: 'Use a single-column layout, standard section headings, and a simple font. Avoid tables, text boxes, images and icons. Mirror the exact skills and job titles from the job description, and save the file as a text-based PDF.',
  },
  {
    q: 'How do I check my resume against a job description?',
    a: 'Upload your resume, then paste or upload the job description in Job Match. CVExpert scores the fit, lists the keywords and skills you are missing, and suggests where to add them.',
  },
  {
    q: 'Which file format is best for ATS?',
    a: 'A text-based PDF works with almost every modern ATS and keeps your layout intact. CVExpert analyses PDF resumes; avoid scanned or image-only PDFs, which an ATS cannot read.',
  },
  {
    q: 'Does CVExpert work for freshers and Indian job portals?',
    a: 'Yes. The checker works for freshers and experienced professionals alike, and the same ATS rules apply to resumes you upload to Naukri, LinkedIn, Indeed and company career sites.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head">
          <h2>ATS Resume Checker FAQs</h2>
          <p>Answers to the questions job seekers ask most about ATS scores.</p>
        </div>

        <div className="pr-faq-grid">
          {faqs.map((faq, i) => (
            <div className={`card pr-faq-item ${open === i ? 'is-open' : ''}`} key={faq.q}>
              <h3>
                <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  {faq.q}
                  <ChevronDown size={18} />
                </button>
              </h3>
              {/* Kept in the DOM when collapsed so crawlers still read every answer. */}
              <p hidden={open !== i}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
    </section>
  );
}
