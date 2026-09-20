import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Eye, ShieldCheck } from './Icons';
import './InterviewPrep.css';

const questions = [
  {
    tag: 'Technical',
    level: 'Medium',
    prompt: 'Explain the difference between supervised and unsupervised learning. Can you give examples of when you would use each?',
    hint: 'Anchor it in labels: does the training data come with the answer attached?',
    answer:
      'Supervised learning trains on labelled examples to predict a known target — churn prediction or resume-to-role scoring. Unsupervised learning finds structure in unlabelled data — clustering candidates by skill profile, or topic modelling job descriptions.',
  },
  {
    tag: 'System Design',
    level: 'Hard',
    prompt: 'How would you design a resume parsing pipeline that handles 10,000 uploads per hour?',
    hint: 'Think queue-backed workers, idempotency, and where the expensive model calls live.',
    answer:
      'Accept uploads to object storage, publish a job to a queue, and let autoscaled workers parse asynchronously. Cache embeddings per document hash, keep LLM calls behind a rate-limited pool, and write results to a store the API reads — so the request path never blocks on parsing.',
  },
  {
    tag: 'Behavioral',
    level: 'Easy',
    prompt: 'Tell me about a time you had to ship under a hard deadline with incomplete requirements.',
    hint: 'Use STAR — and be specific about the trade-off you consciously chose.',
    answer:
      'Pick one real project. Set the situation and your task in two sentences, spend most of the answer on the actions you personally took, then close with a measurable result and what you would do differently.',
  },
  {
    tag: 'Coding',
    level: 'Medium',
    prompt: 'Given two resumes as skill sets, return the skills the candidate is missing for a target role.',
    hint: 'Set difference — but talk through normalising synonyms before you code.',
    answer:
      'Normalise both sides to a canonical skill vocabulary, then compute required minus candidate as a set difference. Rank the gaps by how often each skill appears in postings for the role so the output is actionable.',
  },
  {
    tag: 'Technical',
    level: 'Medium',
    prompt: 'What does an ATS actually parse from a resume, and how does that change how you format one?',
    hint: 'The parser is reading a document tree, not a picture.',
    answer:
      'Most systems read text order, headings, dates and contact blocks. Multi-column layouts, tables and text baked into images get mangled — so a single-column layout with conventional section headings survives parsing far better.',
  },
];

const checklist = [
  'Resume-aware questions',
  'Technical questions',
  'Behavioral questions',
  'System design questions',
  'Coding questions',
  'AI feedback on answers',
  'Role-specific preparation',
];

export default function InterviewPrep() {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hinted, setHinted] = useState(false);

  const q = questions[index];

  const go = (step: number) => {
    setIndex((i) => (i + step + questions.length) % questions.length);
    setRevealed(false);
    setHinted(false);
  };

  return (
    <section className="prep" id="product">
      <div className="container prep-grid">
        <div className="prep-copy">
          <span className="eyebrow">Interview Preparation</span>
          <h2>
            Never Walk Into An{' '}
            <br />
            Interview Unprepared.
          </h2>
          <p>
            Get personalized interview questions based on your resume and target job.
            Practice with AI feedback and build confidence.
          </p>
          <Link className="btn btn-primary btn-lg" to="/login?tab=signup">
            Generate My Interview Questions <ArrowRight />
          </Link>
        </div>

        <div className="prep-carousel">
          <button type="button" className="prep-arrow" onClick={() => go(-1)} aria-label="Previous question">
            <ChevronLeft />
          </button>

          <article className="card prep-card">
            <header>
              <span className="tag tag-blue">{q.tag}</span>
              <span className="tag tag-amber">{q.level}</span>
              <span className="prep-count">Question {index + 1} of {questions.length}</span>
            </header>

            <h3>{q.prompt}</h3>

            <button
              type="button"
              className={`prep-reveal ${revealed ? 'is-open' : ''}`}
              onClick={() => setRevealed((r) => !r)}
              aria-expanded={revealed}
            >
              <span><Eye size={14} /> Expected Answer <em>(Click to reveal)</em></span>
              <ChevronDown size={16} />
            </button>

            {revealed && <p className="prep-answer">{q.answer}</p>}
            {hinted && !revealed && <p className="prep-hint">{q.hint}</p>}

            <footer>
              <button type="button" className="btn btn-ghost prep-btn" onClick={() => setHinted((h) => !h)}>
                <Eye size={15} /> {hinted ? 'Hide Hint' : 'Show Hint'}
              </button>
              <button type="button" className="btn prep-btn prep-btn-outline" onClick={() => setRevealed(true)}>
                <ShieldCheck size={15} /> Reveal Answer
              </button>
            </footer>
          </article>

          <button type="button" className="prep-arrow" onClick={() => go(1)} aria-label="Next question">
            <ChevronRight />
          </button>
        </div>

        <ul className="card prep-list">
          {checklist.map((item) => (
            <li key={item}><CheckCircle size={17} /> {item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
