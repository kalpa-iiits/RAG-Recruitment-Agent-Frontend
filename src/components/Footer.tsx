import { GitHub, LinkedIn, Logo, Twitter, YouTube } from './Icons';
import './Footer.css';

const productLinks = ['Product', 'Features', 'Pricing', 'Blog', 'Contact'];
const legalLinks = ['Privacy Policy', 'Terms of Service'];
const socials = [
  { label: 'LinkedIn', Icon: LinkedIn },
  { label: 'Twitter', Icon: Twitter },
  { label: 'YouTube', Icon: YouTube },
  { label: 'GitHub', Icon: GitHub },
];

export default function Footer() {
  return (
    <footer className="footer" id="resources">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span><Logo size={24} /> CVExpert</span>
          <small>Your AI career copilot.</small>
        </div>

        <nav className="footer-links">
          {productLinks.map((l) => (
            <a key={l} href="#footer-link">{l}</a>
          ))}
        </nav>

        <nav className="footer-links footer-legal">
          {legalLinks.map((l) => (
            <a key={l} href="#footer-link">{l}</a>
          ))}
        </nav>

        <div className="footer-social">
          {socials.map(({ label, Icon }) => (
            <a key={label} href="#social" aria-label={label}><Icon /></a>
          ))}
        </div>

        <small className="footer-copy">© 2026 CVExpert. All rights reserved.</small>
      </div>
    </footer>
  );
}
