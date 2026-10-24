import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import LogoCloud from '../components/LogoCloud';
import Features from '../components/Features';
import InterviewPrep from '../components/InterviewPrep';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import FinalCta from '../components/FinalCta';
import Footer from '../components/Footer';
import AtsGuide from '../components/AtsGuide';
import Faq from '../components/Faq';
import Seo from '../components/Seo';
import { PAGE_SEO } from '../lib/seo';
import type { Theme } from '../hooks/useTheme';

type Props = { theme: Theme; onThemeChange: (t: Theme) => void };

export default function Landing({ theme, onThemeChange }: Props) {
  return (
    <>
      <Seo {...PAGE_SEO.home} />
      <Navbar theme={theme} onThemeChange={onThemeChange} />
      <main>
        <Hero />
        <LogoCloud />
        <AtsGuide />
        <Features />
        <InterviewPrep />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
