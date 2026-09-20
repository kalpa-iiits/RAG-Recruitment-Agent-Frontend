import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowRight, BadgeCheck, CardIcon, ChevronDown, Crown, Lock, Users, Zap } from '../components/Icons';
import type { Theme } from '../hooks/useTheme';
import { PLANS, PRO_MONTHLY, PRO_YEARLY_PER_MONTH, PRO_YEARLY_TOTAL, rupees } from '../lib/plans';
import './PricingPage.css';

type Cycle = 'monthly' | 'yearly';

const assurances = [
  { icon: Lock, title: 'Secure Resume Storage', body: 'Your data is always protected' },
  { icon: Users, title: '10,000+ Resumes Analyzed', body: 'Join a growing community' },
  { icon: Zap, title: 'AI Analysis in Under 60 Seconds', body: 'Get instant insights' },
  { icon: CardIcon, title: 'Cancel Anytime', body: 'No long-term contracts' },
];

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Plans are month to month unless you choose yearly billing, and cancelling stops the next renewal. You keep access until the end of the period you have already paid for.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Billing is not switched on yet, so no payment method is collected today. Every account currently runs on the Free plan.',
  },
  {
    q: 'Do unused interview questions roll over?',
    a: 'No. The Free plan’s monthly allowance resets at the start of each billing month. Pro has no cap, so there is nothing to roll over.',
  },
  {
    q: 'Is my data secure?',
    a: 'Your resume is processed to produce your analysis and is tied to your account. Analyses are held for your session and are not shared with other users.',
  },
  {
    q: 'Can I upload multiple resumes?',
    a: 'Free covers one analysis a month. Pro lets you analyse as many resumes as you like and keep comparing versions as you iterate.',
  },
  {
    q: 'Which file formats are supported?',
    a: 'Resumes must be PDF. A job description can be uploaded as PDF or plain text when you want the analysis scored against a specific posting.',
  },
];

type Props = { theme: Theme; onThemeChange: (t: Theme) => void };

export default function PricingPage({ theme, onThemeChange }: Props) {
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const proPrice = cycle === 'monthly' ? PRO_MONTHLY : PRO_YEARLY_PER_MONTH;

  return (
    <>
      <Navbar theme={theme} onThemeChange={onThemeChange} />

      <main className="pr">
        <header className="container pr-head">
          <span className="hero-badge">Invest in your career</span>
          <h1>Simple, Transparent Pricing</h1>
          <p>Choose the plan that's right for your career goals. No hidden fees. Cancel anytime.</p>

          <div className="pr-toggle" role="group" aria-label="Billing cycle">
            <button
              type="button"
              className={cycle === 'monthly' ? 'is-active' : ''}
              onClick={() => setCycle('monthly')}
              aria-pressed={cycle === 'monthly'}
            >
              Monthly
            </button>
            <button
              type="button"
              className={cycle === 'yearly' ? 'is-active' : ''}
              onClick={() => setCycle('yearly')}
              aria-pressed={cycle === 'yearly'}
            >
              Yearly <span className="pr-save">Save 20%</span>
            </button>
          </div>
        </header>

        <div className="container pr-plans">
          {PLANS.map((plan) => (
            <article className={`card pr-plan ${plan.featured ? 'is-featured' : ''}`} key={plan.name}>
              {plan.featured && (
                <span className="pr-popular"><Crown size={14} /> Most Popular</span>
              )}

              <h2>{plan.name}</h2>
              <p className="pr-tagline">{plan.tagline}</p>

              {plan.monthly === null ? (
                <p className="pr-price pr-price-custom">Custom pricing</p>
              ) : (
                <p className="pr-price">
                  <strong>{rupees(plan.monthly === PRO_MONTHLY ? proPrice : plan.monthly)}</strong>
                  <span>/month</span>
                </p>
              )}

              {plan.monthly === PRO_MONTHLY && cycle === 'yearly' && (
                <p className="pr-billed">Billed {rupees(PRO_YEARLY_TOTAL)} yearly</p>
              )}

              <ul className="pr-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="pr-check"><BadgeCheck size={13} /></span>
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.to.startsWith('mailto:') ? (
                <a className="btn btn-ghost pr-cta" href={plan.to}>{plan.cta}</a>
              ) : (
                <Link className={`btn ${plan.featured ? 'btn-primary' : 'btn-ghost'} pr-cta`} to={plan.to}>
                  {plan.cta} {plan.featured && <ArrowRight />}
                </Link>
              )}
            </article>
          ))}
        </div>

        <ul className="container pr-assurances">
          {assurances.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <span className="pr-assurance-icon"><Icon size={19} /></span>
              <span>
                <strong>{title}</strong>
                <em>{body}</em>
              </span>
            </li>
          ))}
        </ul>

        <section className="container pr-faq">
          <div className="section-head">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about our plans.</p>
          </div>

          <div className="pr-faq-grid">
            {faqs.map((faq, i) => (
              <div className={`card pr-faq-item ${openFaq === i ? 'is-open' : ''}`} key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  {faq.q}
                  <ChevronDown size={18} />
                </button>
                {openFaq === i && <p>{faq.a}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="container">
          <div className="pr-cta-band">
            <div>
              <h2>Ready to boost your career?</h2>
              <p>Join thousands of job seekers who are landing interviews with CVExpert.</p>
            </div>
            <Link className="btn btn-primary btn-lg" to="/login?tab=signup">
              Get Started Now <ArrowRight />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
