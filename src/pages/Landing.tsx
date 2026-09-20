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
import type { Theme } from '../hooks/useTheme';

type Props = { theme: Theme; onThemeChange: (t: Theme) => void };

export default function Landing({ theme, onThemeChange }: Props) {
  return (
    <>
      <Navbar theme={theme} onThemeChange={onThemeChange} />
      <main>
        <Hero />
        <LogoCloud />
        <Features />
        <InterviewPrep />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
