/**
 * Head tags for the public, indexable pages. Shared by the pages themselves
 * and by scripts/prerender.mjs, so the static HTML crawlers fetch matches
 * what the page sets once it runs.
 */
export type PageSeo = { title: string; description: string; path: string };

export const ORIGIN = 'https://www.cvexpert.in';

export const PAGE_SEO = {
  home: {
    title: 'Free ATS Resume Checker & Score — AI Resume Analyzer | CVExpert',
    description:
      "Check your resume's ATS score free in under 60 seconds. CVExpert's AI resume checker finds missing keywords, fixes formatting, rewrites bullet points and matches your CV to any job description.",
    path: '/',
  },
  pricing: {
    title: 'Pricing — Free & Pro ATS Resume Checker Plans | CVExpert',
    description:
      'Start free with one ATS resume analysis a month, or go Pro for unlimited resume checks, AI rewrites, job matching and interview prep from ₹499/month.',
    path: '/pricing',
  },
} satisfies Record<string, PageSeo>;
