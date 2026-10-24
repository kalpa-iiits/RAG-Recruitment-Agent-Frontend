import { Link } from 'react-router-dom';
import { Logo } from './Icons';
import './Footer.css';

// Real destinations only: placeholder "#" links are crawled as broken pages.
const productLinks = [
  { label: 'ATS Resume Checker', href: '/#ats-checker' },
  { label: 'Features', href: '/#features' },
  { label: 'Interview Prep', href: '/#product' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
];

export default function Footer() {
  return (
    <footer className="footer" id="resources">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span><Logo size={24} /> CVExpert</span>
          <small>Free ATS resume checker and AI career copilot.</small>
        </div>

        <nav className="footer-links">
          {productLinks.map((l) => (
            l.href.startsWith('/#')
              ? <a key={l.label} href={l.href}>{l.label}</a>
              : <Link key={l.label} to={l.href}>{l.label}</Link>
          ))}
        </nav>

        <nav className="footer-links footer-legal">
          <a href="mailto:support@cvexpert.in">Contact</a>
        </nav>

        <small className="footer-copy">© 2026 CVExpert. All rights reserved.</small>
      </div>
    </footer>
  );
}
