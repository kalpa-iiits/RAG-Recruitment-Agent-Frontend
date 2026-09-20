import { Link } from 'react-router-dom';
import { ArrowRight } from './Icons';
import { PLANS, rupees } from '../lib/plans';
import './Pricing.css';

const Check = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Pricing() {
  const plans = PLANS.filter((plan) => plan.onLanding);

  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-head">
          <h2>Simple, Transparent Pricing</h2>
          <p>Choose the plan that's right for your career goals.</p>
        </div>

        <div className="price-grid">
          {plans.map((plan) => (
            <article className={`card plan ${plan.featured ? 'is-featured' : ''}`} key={plan.name}>
              <header>
                <h3>{plan.name}</h3>
                {plan.featured && <span className="plan-badge">Most Popular</span>}
              </header>

              <p className="plan-price">
                <strong>{rupees(plan.monthly ?? 0)}</strong>
                <span>/month</span>
              </p>

              <ul>
                {plan.highlights.map((feature) => (
                  <li key={feature}><Check /> {feature}</li>
                ))}
              </ul>

              <Link className={`btn ${plan.featured ? 'btn-primary' : 'btn-ghost'} plan-cta`} to={plan.to}>
                {plan.landingCta}
              </Link>
            </article>
          ))}
        </div>

        <p className="price-more">
          Need team seats, API access or custom integrations?{' '}
          <Link to="/pricing">Compare all plans <ArrowRight size={14} /></Link>
        </p>
      </div>
    </section>
  );
}
