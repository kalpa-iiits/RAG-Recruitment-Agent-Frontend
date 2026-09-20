import { Adobe, Amazon, Google, Meta, Microsoft, Netflix, PayPal, Salesforce, Uber } from './BrandLogos';
import './LogoCloud.css';

const logos = [Google, Amazon, Microsoft, Meta, Adobe, Netflix, Uber, Salesforce, PayPal];

export default function LogoCloud() {
  return (
    <section className="logos">
      <div className="container">
        <p className="logos-caption">Trusted by candidates interviewing at</p>
        <div className="logos-row">
          {logos.map((L, i) => (
            <span className="logos-item" key={i}><L /></span>
          ))}
        </div>
      </div>
    </section>
  );
}
