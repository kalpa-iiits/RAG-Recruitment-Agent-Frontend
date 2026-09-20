import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CardIcon,
  ChevronRight,
  Crown,
  Download,
  Gear,
  ShieldCheck,
  Trash,
  Users,
} from '../components/Icons';
import { useAuth } from '../auth/context';
import * as api from '../lib/api';
import { ApiError, type AppConfig, type Preferences, type Profile } from '../lib/api';
import { displayName } from '../lib/identity';
import { PLANS, rupees } from '../lib/plans';
import './Settings.css';

type Tab = 'profile' | 'subscription' | 'notifications' | 'security' | 'preferences';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'profile', label: 'Profile', icon: Users },
  { id: 'subscription', label: 'Subscription', icon: CardIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Privacy & Security', icon: ShieldCheck },
  { id: 'preferences', label: 'Preferences', icon: Gear },
];

const TEXT_FIELDS = [
  { key: 'full_name', label: 'Full Name', placeholder: 'Your name' },
  { key: 'headline', label: 'Headline', placeholder: 'AI Engineer | Building GenAI Applications' },
  { key: 'location', label: 'Location', placeholder: 'City, Country' },
  { key: 'linkedin', label: 'LinkedIn Profile', placeholder: 'https://linkedin.com/in/…' },
  { key: 'website', label: 'Portfolio / Website (optional)', placeholder: 'https://…' },
] as const;

const NOTIFICATIONS: { key: keyof Preferences; label: string; body: string }[] = [
  {
    key: 'email_analysis_complete',
    label: 'Analysis complete',
    body: 'Tell me when a resume analysis finishes.',
  },
  {
    key: 'email_weekly_tips',
    label: 'Weekly tips',
    body: 'A weekly digest of resume and interview advice.',
  },
  {
    key: 'email_product_updates',
    label: 'Product updates',
    body: 'New features and changes to CVExpert.',
  },
];

function initials(name: string, email: string): string {
  const source = name.trim() || displayName(email);
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export default function Settings() {
  const { token, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tab, setTab] = useState<Tab>('profile');

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [about, setAbout] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([api.getProfile(token), api.getConfig(token).catch(() => null)])
      .then(([loaded, cfg]) => {
        if (cancelled) return;
        setProfile(loaded);
        setConfig(cfg);
        setDraft(Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, loaded[f.key]])));
        setAbout(loaded.about);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const freePlan = useMemo(() => PLANS.find((plan) => plan.name === 'Free'), []);
  const proPlan = useMemo(() => PLANS.find((plan) => plan.name === 'Pro'), []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.updateProfile(token, { ...draft, about });
      setProfile(updated);
      setMessage({ kind: 'ok', text: 'Profile saved.' });
    } catch (caught) {
      setMessage({
        kind: 'error',
        text: caught instanceof ApiError ? caught.message : 'Could not save your profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const savePreference = async (patch: Partial<Preferences>) => {
    if (!token || !profile) return;
    // Optimistic: toggles should feel instant.
    const previous = profile;
    setProfile({ ...profile, preferences: { ...profile.preferences, ...patch } });
    try {
      setProfile(await api.updateProfile(token, { preferences: patch }));
    } catch {
      setProfile(previous);
      setMessage({ kind: 'error', text: 'Could not save that preference.' });
    }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ kind: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ kind: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      await api.changePassword(token, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ kind: 'ok', text: 'Password changed.' });
    } catch (caught) {
      setMessage({
        kind: 'error',
        text: caught instanceof ApiError ? caught.message : 'Could not change your password.',
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadData = async () => {
    if (!token) return;
    setMessage(null);
    try {
      const data = await api.exportAccount(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cvexpert-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage({ kind: 'ok', text: 'Your data has been downloaded.' });
    } catch {
      setMessage({ kind: 'error', text: 'Could not export your data.' });
    }
  };

  const removeAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !profile) return;
    setMessage(null);
    setSaving(true);
    try {
      await api.deleteAccount(token, deletePassword);
      signOut();
      navigate('/');
    } catch (caught) {
      setMessage({
        kind: 'error',
        text: caught instanceof ApiError ? caught.message : 'Could not delete your account.',
      });
      setSaving(false);
    }
  };

  const head = (
    <header className="st-head">
      <span className="eyebrow">Settings</span>
      <h1>Account Settings</h1>
      <p>Manage your account, preferences, and personal information.</p>
    </header>
  );

  if (state === 'loading') {
    return (
      <>
        {head}
        <div className="card ov-placeholder">Loading your settings…</div>
      </>
    );
  }

  if (state === 'error' || !profile) {
    return (
      <>
        {head}
        <div className="card ov-placeholder ov-error">Could not load your settings.</div>
      </>
    );
  }

  const memberSince = new Date(profile.member_since);
  const memberLabel = Number.isNaN(memberSince.getTime())
    ? '—'
    : memberSince.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

  return (
    <>
      {head}

      <nav className="st-tabs" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'is-active' : ''}
            onClick={() => {
              setTab(id);
              setMessage(null);
            }}
          >
            <Icon size={17} /> {label}
          </button>
        ))}
      </nav>

      {message && (
        <p className={message.kind === 'ok' ? 'st-ok' : 'form-alert'} role="status">
          {message.text}
        </p>
      )}

      <div className="st-grid">
        <div className="st-main">
          {tab === 'profile' && (
            <section className="card st-panel">
              <h2>Profile Information</h2>
              <p className="st-sub">Update your personal information and how it appears on CVExpert.</p>

              <div className="st-identity">
                <span className="st-avatar">{initials(profile.full_name, profile.email)}</span>
                <div>
                  <strong>
                    {profile.full_name || displayName(profile.email)}
                    <span className="chip chip-plain">Free Plan</span>
                  </strong>
                  <em>{profile.email}</em>
                  <small>Member since {memberLabel}</small>
                </div>
              </div>

              <form onSubmit={saveProfile}>
                <div className="st-fields">
                  {TEXT_FIELDS.map(({ key, label, placeholder }) => (
                    <label className="form-field" key={key}>
                      <span>{label}</span>
                      <input
                        type="text"
                        value={draft[key] ?? ''}
                        placeholder={placeholder}
                        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                        disabled={saving}
                      />
                    </label>
                  ))}
                </div>

                <label className="form-field">
                  <span>About Me</span>
                  <textarea
                    rows={4}
                    value={about}
                    placeholder="A short summary of your experience and interests."
                    onChange={(e) => setAbout(e.target.value)}
                    disabled={saving}
                  />
                </label>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </section>
          )}

          {tab === 'subscription' && (
            <section className="card st-panel">
              <h2>Subscription</h2>
              <p className="st-sub">You are on the Free plan. Billing is not enabled yet, so no payment method is stored.</p>

              <div className="st-plans">
                {[freePlan, proPlan].map(
                  (plan) =>
                    plan && (
                      <div className={`st-plan ${plan.name === 'Free' ? 'is-current' : ''}`} key={plan.name}>
                        <header>
                          <strong>{plan.name}</strong>
                          {plan.name === 'Free' ? (
                            <span className="chip chip-green">Current</span>
                          ) : (
                            <span className="chip chip-plain">{rupees(plan.monthly ?? 0)}/month</span>
                          )}
                        </header>
                        <ul>
                          {plan.features.map((feature) => (
                            <li key={feature}><BadgeCheck size={14} /> {feature}</li>
                          ))}
                        </ul>
                      </div>
                    ),
                )}
              </div>

              <Link className="btn btn-primary" to="/pricing">
                Compare plans <ArrowRight />
              </Link>
            </section>
          )}

          {tab === 'notifications' && (
            <section className="card st-panel">
              <h2>Notifications</h2>
              <p className="st-sub">
                Your choices are saved to your account. Email delivery is not wired up yet, so
                nothing is sent today.
              </p>

              <ul className="st-toggles">
                {NOTIFICATIONS.map(({ key, label, body }) => (
                  <li key={key}>
                    <div>
                      <strong>{label}</strong>
                      <em>{body}</em>
                    </div>
                    <label className="st-switch">
                      <input
                        type="checkbox"
                        checked={Boolean(profile.preferences[key])}
                        onChange={(e) => savePreference({ [key]: e.target.checked } as Partial<Preferences>)}
                      />
                      <span />
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === 'security' && (
            <>
              <section className="card st-panel">
                <h2>Change Password</h2>
                <p className="st-sub">At least 8 characters. You stay signed in on this device.</p>

                <form onSubmit={submitPassword} className="st-narrow">
                  <label className="form-field">
                    <span>Current password</span>
                    <input type="password" autoComplete="current-password" value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)} disabled={saving} />
                  </label>
                  <label className="form-field">
                    <span>New password</span>
                    <input type="password" autoComplete="new-password" value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)} disabled={saving} />
                  </label>
                  <label className="form-field">
                    <span>Confirm new password</span>
                    <input type="password" autoComplete="new-password" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} disabled={saving} />
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={saving || !currentPassword}>
                    Update password
                  </button>
                </form>
              </section>

              <section className="card st-panel st-danger">
                <h2>Delete Account</h2>
                <p className="st-sub">
                  This permanently removes your account, your profile and all
                  {' '}{profile.saved_resume_count} saved resume{profile.saved_resume_count === 1 ? '' : 's'}.
                  It cannot be undone.
                </p>

                <form onSubmit={removeAccount} className="st-narrow">
                  <label className="form-field">
                    <span>Type your email <code>{profile.email}</code> to confirm</span>
                    <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                      autoComplete="off" disabled={saving} />
                  </label>
                  <label className="form-field">
                    <span>Your password</span>
                    <input type="password" value={deletePassword} autoComplete="current-password"
                      onChange={(e) => setDeletePassword(e.target.value)} disabled={saving} />
                  </label>
                  <button
                    type="submit"
                    className="btn st-delete-btn"
                    disabled={saving || deleteConfirm !== profile.email || !deletePassword}
                  >
                    <Trash size={15} /> Delete my account
                  </button>
                </form>
              </section>
            </>
          )}

          {tab === 'preferences' && (
            <section className="card st-panel">
              <h2>Preferences</h2>
              <p className="st-sub">Defaults used when you generate interview questions.</p>

              <div className="st-fields">
                <label className="form-field">
                  <span>Default target role</span>
                  <select
                    value={profile.preferences.default_role}
                    onChange={(e) => savePreference({ default_role: e.target.value })}
                  >
                    <option value="">Not set</option>
                    {Object.keys(config?.roles ?? {}).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Default difficulty</span>
                  <select
                    value={profile.preferences.default_difficulty}
                    onChange={(e) => savePreference({ default_difficulty: e.target.value })}
                  >
                    {['Easy', 'Medium', 'Hard'].map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Default number of questions</span>
                  <select
                    value={profile.preferences.default_question_count}
                    onChange={(e) => savePreference({ default_question_count: Number(e.target.value) })}
                  >
                    {[3, 5, 8, 10, 15].map((count) => (
                      <option key={count} value={count}>{count} questions</option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="st-note">Preferences save as you change them.</p>
            </section>
          )}
        </div>

        <aside className="st-aside">
          <section className="card st-panel">
            <h3>Account Plan</h3>
            <div className="st-plan-head">
              <span className="st-plan-icon"><Crown size={18} /></span>
              <div>
                <strong>Free Plan</strong>
                <em>Get more features with Pro</em>
              </div>
            </div>
            <ul className="st-plan-features">
              {(freePlan?.features ?? []).map((feature) => (
                <li key={feature}><BadgeCheck size={14} /> {feature}</li>
              ))}
            </ul>
            <Link className="btn btn-primary st-upgrade" to="/pricing">Upgrade to Pro</Link>
          </section>

          <section className="card st-panel">
            <h3>Quick Actions</h3>
            <ul className="st-quick">
              <li>
                <button type="button" onClick={downloadData}>
                  <span className="st-quick-icon"><Download size={17} /></span>
                  <span>
                    <strong>Download My Data</strong>
                    <em>Export your profile and saved resumes</em>
                  </span>
                  <ChevronRight size={16} />
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { setTab('security'); setMessage(null); }}>
                  <span className="st-quick-icon is-danger"><Trash size={17} /></span>
                  <span>
                    <strong>Delete Account</strong>
                    <em>Permanently delete your account</em>
                  </span>
                  <ChevronRight size={16} />
                </button>
              </li>
            </ul>
          </section>

          <section className="card st-panel st-help">
            <h3>Need Help?</h3>
            <p>Questions about your account or how the analysis works?</p>
            <Link className="btn btn-ghost" to="/dashboard/qa">Ask the resume assistant</Link>
          </section>
        </aside>
      </div>
    </>
  );
}
