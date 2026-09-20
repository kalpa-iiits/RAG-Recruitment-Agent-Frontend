/**
 * Single source of truth for plans, shared by the landing-page summary and
 * the full /pricing page — otherwise the two drift apart.
 */
export const PRO_MONTHLY = 499;
export const YEARLY_DISCOUNT = 0.2;
export const PRO_YEARLY_PER_MONTH = Math.round(PRO_MONTHLY * (1 - YEARLY_DISCOUNT));
export const PRO_YEARLY_TOTAL = PRO_YEARLY_PER_MONTH * 12;

export const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export type Plan = {
  name: string;
  tagline: string;
  /** null means custom pricing. */
  monthly: number | null;
  /** Full list, shown on /pricing. */
  features: string[];
  /**
   * Shorter list for the landing page. Kept the same length across plans so
   * the summary cards line up instead of leaving a gap in the shorter one.
   */
  highlights: string[];
  /** Button label on /pricing. */
  cta: string;
  /** Button label in the landing-page summary — the two designs differ. */
  landingCta: string;
  to: string;
  featured: boolean;
  /** Whether the landing-page summary includes this plan. */
  onLanding: boolean;
};

export const PLANS: Plan[] = [
  {
    name: 'Free',
    tagline: 'Get started with basic analysis',
    monthly: 0,
    features: [
      '1 resume analysis per month',
      'Basic ATS score',
      'Limited AI Q&A',
      '5 interview questions/month',
    ],
    highlights: [
      '1 resume analysis per month',
      'Basic ATS score',
      'Limited AI Q&A',
      '5 interview questions/month',
    ],
    cta: 'Analyze My Resume',
    landingCta: 'Get Started',
    to: '/login?tab=signup',
    featured: false,
    onLanding: true,
  },
  {
    name: 'Pro',
    tagline: 'Best for active job seekers',
    monthly: PRO_MONTHLY,
    features: [
      'Unlimited resume analysis',
      'Detailed skill gap analysis',
      'AI resume rewrite',
      'Unlimited Q&A with resume copilot',
      'Personalized interview questions',
      'Download improved resume',
    ],
    highlights: [
      'Unlimited resume analysis',
      'AI resume rewrite',
      'Personalized interview questions',
      'Unlimited Q&A with resume copilot',
    ],
    cta: 'Unlock Pro Features',
    landingCta: 'Start Pro',
    to: '/login?tab=signup',
    featured: true,
    onLanding: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For teams and organizations',
    monthly: null,
    features: [
      'Everything in Pro',
      'Team management',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Volume discounts',
    ],
    highlights: [],
    cta: 'Talk to Sales',
    landingCta: 'Talk to Sales',
    to: 'mailto:sales@example.com?subject=CVExpert%20Enterprise',
    featured: false,
    onLanding: false,
  },
];
