import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import RequireAuth from './auth/RequireAuth';
import Dashboard from './pages/Dashboard';
import InterviewPrep from './pages/InterviewPrep';
import JobMatch from './pages/JobMatch';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Overview from './pages/Overview';
import PricingPage from './pages/PricingPage';
import ResumeAnalysis from './pages/ResumeAnalysis';
import ResumeQA from './pages/ResumeQA';
import ResumeRewrite from './pages/ResumeRewrite';
import SavedResumes from './pages/SavedResumes';
import Settings from './pages/Settings';

export default function App() {
  // Applied at the root so the dashboard and login honour it too.
  const { theme, setTheme } = useTheme();
  const { pathname, hash } = useLocation();

  // Client-side navigation keeps the previous page's scroll position, so a
  // new route would open mid-page. For a section link (#hash) the browser's own
  // jump can be lost when the app replaces the prerendered markup on load, so
  // scroll to the section once it has rendered.
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'instant' });
  }, [pathname, hash]);

  return (
    <Routes>
      <Route path="/" element={<Landing theme={theme} onThemeChange={setTheme} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pricing" element={<PricingPage theme={theme} onThemeChange={setTheme} />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard theme={theme} onThemeChange={setTheme} />
          </RequireAuth>
        }
      >
        <Route index element={<Overview />} />
        <Route path="analysis" element={<ResumeAnalysis />} />
        <Route path="rewrite" element={<ResumeRewrite />} />
        <Route path="interview" element={<InterviewPrep />} />
        <Route path="qa" element={<ResumeQA />} />
        <Route path="job-match" element={<JobMatch />} />
        <Route path="saved" element={<SavedResumes />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* unknown paths fall back to the landing page */}
      <Route path="*" element={<Landing theme={theme} onThemeChange={setTheme} />} />
    </Routes>
  );
}
