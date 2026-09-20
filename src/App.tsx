import { Route, Routes } from 'react-router-dom';
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
