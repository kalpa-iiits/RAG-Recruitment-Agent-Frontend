type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const Logo = ({ size = 28 }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
    <rect width="32" height="32" rx="9" fill="#e7352b" />
    <path d="M10 8.5h11.5a.9.9 0 0 1 .78 1.35l-2.1 3.6 2.1 3.6a.9.9 0 0 1-.78 1.35H12v5.1" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Sun = ({ size = 17 }: P) => (
  <svg {...base(size)} aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const Moon = ({ size = 17 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export const ChevronDown = ({ size = 15 }: P) => (
  <svg {...base(size)} aria-hidden><path d="m6 9 6 6 6-6" /></svg>
);
export const ChevronLeft = ({ size = 18 }: P) => (
  <svg {...base(size)} aria-hidden><path d="m15 18-6-6 6-6" /></svg>
);
export const ChevronRight = ({ size = 18 }: P) => (
  <svg {...base(size)} aria-hidden><path d="m9 18 6-6-6-6" /></svg>
);
export const ArrowRight = ({ size = 16 }: P) => (
  <svg {...base(size)} aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export const CheckCircle = ({ size = 17 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="m8 12.3 2.7 2.7L16 9.6" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Upload = ({ size = 17 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M21 15v3.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V15M12 15V3M7.5 7.5 12 3l4.5 4.5" />
  </svg>
);

export const Download = ({ size = 17 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M21 15v3.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V15M12 3v12M7.5 10.5 12 15l4.5-4.5" />
  </svg>
);

export const Play = ({ size = 17 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10.3 8.8 15.4 12l-5.1 3.2V8.8Z" fill="currentColor" />
  </svg>
);

export const CardIcon = ({ size = 15 }: P) => (
  <svg {...base(size)} aria-hidden>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" />
  </svg>
);
export const ShieldCheck = ({ size = 15 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M12 2.8 20 6v6c0 4.6-3.2 8.2-8 9.2-4.8-1-8-4.6-8-9.2V6l8-3.2Z" /><path d="m9 12 2.2 2.2L15.4 10" />
  </svg>
);
export const BadgeCheck = ({ size = 15 }: P) => (
  <svg {...base(size)} aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="m8.6 12.2 2.3 2.3 4.5-4.7" />
  </svg>
);

/* ---------- dashboard sidebar ---------- */
export const Home = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden><path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" /></svg>
);
export const FileText = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M13.5 3.2V8H19M9 13h6M9 16.5h4" />
  </svg>
);
export const Sparkles = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M12 3.5 13.6 8 18 9.6 13.6 11.2 12 15.7 10.4 11.2 6 9.6 10.4 8 12 3.5ZM18.5 15l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />
  </svg>
);
export const MessageSquare = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden><path d="M20.5 15.2a2 2 0 0 1-2 2H8l-4.5 3.4V5.8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9.4Z" /></svg>
);
export const Target = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden>
    <circle cx="12" cy="12" r="8.6" /><circle cx="12" cy="12" r="4.8" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
export const Bookmark = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden><path d="M6.5 3.8h11v17l-5.5-4-5.5 4v-17Z" /></svg>
);
export const Briefcase = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden>
    <rect x="2.8" y="7" width="18.4" height="13" rx="2.4" /><path d="M8.8 7V5.4a1.8 1.8 0 0 1 1.8-1.8h2.8a1.8 1.8 0 0 1 1.8 1.8V7" />
  </svg>
);
export const TrendUp = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden><path d="M3.5 16.5 9.5 10l3.6 3.6L20.5 6" /><path d="M15.5 6h5v5" /></svg>
);
export const AlertCircle = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7.8v5M12 16.1h.01" /></svg>
);
export const Eye = ({ size = 15 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M2.2 12S5.8 5.6 12 5.6 21.8 12 21.8 12 18.2 18.4 12 18.4 2.2 12 2.2 12Z" /><circle cx="12" cy="12" r="2.8" />
  </svg>
);
export const Rocket = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M13.2 4.4c3.4-2 6.4-1.6 6.4-1.6s.4 3-1.6 6.4c-1.6 2.7-4.9 5-7.2 6.2l-3.8-3.8c1.2-2.3 3.5-5.6 6.2-7.2Z" />
    <path d="M7 14.6 5 16.6M9.4 17l-2 2M4.6 12.2l-1.8 1.9" /><circle cx="15" cy="8.4" r="1.4" />
  </svg>
);

export const Star = ({ size = 16, filled = false }: P & { filled?: boolean }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
    aria-hidden
  >
    <path d="m12 3.4 2.7 5.5 6 .9-4.35 4.25 1.03 6-5.38-2.83L6.62 20l1.03-6L3.3 9.8l6-.9L12 3.4Z" />
  </svg>
);

export const Trash = ({ size = 15 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M4 6.5h16M9.5 6.5V4.8a1.4 1.4 0 0 1 1.4-1.4h2.2a1.4 1.4 0 0 1 1.4 1.4v1.7M6.2 6.5 7 19.4a1.6 1.6 0 0 0 1.6 1.5h6.8a1.6 1.6 0 0 0 1.6-1.5l.8-12.9" />
  </svg>
);

export const Bell = ({ size = 20 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.2 7.5-2.2 7.5h16.4S18 14.5 18 8.5" /><path d="M13.7 20a2 2 0 0 1-3.4 0" />
  </svg>
);
export const Gear = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z" />
  </svg>
);
export const Lock = ({ size = 18 }: P) => (
  <svg {...base(size)} aria-hidden>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2.4" />
    <path d="M8 10.5V7.4a4 4 0 0 1 8 0v3.1" />
  </svg>
);

export const Zap = ({ size = 18 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M13.2 2.5 4.6 13.4h6.2l-.9 8.1 8.6-10.9h-6.2l.9-8.1Z" />
  </svg>
);

export const Crown = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M3 8.5 6.8 12 12 4.5 17.2 12 21 8.5 19.4 18H4.6L3 8.5Zm1.9 11.1h14.2v1.6H4.9v-1.6Z" />
  </svg>
);
export const Pencil = ({ size = 15 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M16.4 3.6a2.3 2.3 0 0 1 3.2 3.2L7.4 19H4.2v-3.2L16.4 3.6Z" />
  </svg>
);
export const BarChart = ({ size = 18 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M5 19.5V11M12 19.5V5M19 19.5v-6" strokeWidth="2.2" />
  </svg>
);
export const Users = ({ size = 18 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M15.5 20v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.2V20" />
    <circle cx="9.2" cy="7.4" r="3.4" />
    <path d="M21 20v-1.8a3.6 3.6 0 0 0-2.7-3.5M16.4 4.2a3.6 3.6 0 0 1 0 6.9" />
  </svg>
);
export const HelpCircle = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4M12 16.8h.01" />
  </svg>
);
export const PenSquare = ({ size = 13 }: P) => (
  <svg {...base(size)} aria-hidden>
    <path d="M12 3.8H5.6a1.8 1.8 0 0 0-1.8 1.8v12.8a1.8 1.8 0 0 0 1.8 1.8h12.8a1.8 1.8 0 0 0 1.8-1.8V12" />
    <path d="M17.4 3.2a1.9 1.9 0 0 1 2.7 2.7l-8 8-3.3.6.6-3.3 8-8Z" />
  </svg>
);

/* ---------- social ---------- */
export const LinkedIn = ({ size = 17 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9.5h4v11H3v-11Zm6.5 0h3.8v1.5a4.2 4.2 0 0 1 3.7-1.8c3 0 4.5 1.9 4.5 5.3v6h-4v-5.4c0-1.6-.6-2.5-2-2.5s-2.2 1-2.2 2.6v5.3h-3.8v-11Z" />
  </svg>
);
export const Twitter = ({ size = 17 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M22 5.9c-.7.3-1.5.6-2.4.7a4.1 4.1 0 0 0 1.8-2.3c-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.8A11.7 11.7 0 0 1 3.3 4.7a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5a4.1 4.1 0 0 0 3.3 4 4.2 4.2 0 0 1-1.9.1 4.1 4.1 0 0 0 3.8 2.9A8.3 8.3 0 0 1 2 18.4a11.6 11.6 0 0 0 6.3 1.9c7.6 0 11.7-6.3 11.7-11.7v-.6c.8-.6 1.5-1.3 2-2.1Z" />
  </svg>
);
export const YouTube = ({ size = 17 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15.1V8.9l5.2 3.1-5.2 3.1Z" />
  </svg>
);
export const GitHub = ({ size = 17 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.6 5 .4.3.7 1 .7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
  </svg>
);

export const GoogleG = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.4v2.9h3.7c2.2-2 3.4-5 3.4-8.5Z" fill="#4285F4" />
    <path d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H1.7v3A11.5 11.5 0 0 0 12 23.5Z" fill="#34A853" />
    <path d="M5.5 14.1a6.9 6.9 0 0 1 0-4.4v-3H1.7a11.5 11.5 0 0 0 0 10.4l3.8-3Z" fill="#FBBC05" />
    <path d="M12 5c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.7 6.7l3.8 3C6.4 7 9 5 12 5Z" fill="#EA4335" />
  </svg>
);

export const Sparks = ({ className }: P) => (
  <svg className={className} width="64" height="58" viewBox="0 0 64 58" fill="none" aria-hidden>
    <path d="M30 2c3.6 6.6 9.3 11 17 13.2-7.7 2.2-13.4 6.6-17 13.2-3.6-6.6-9.3-11-17-13.2C20.7 13 26.4 8.6 30 2Z" fill="#e7352b" />
    <path d="M52 30c2.2 4 5.6 6.6 10.2 7.9-4.6 1.3-8 4-10.2 7.9-2.2-4-5.6-6.6-10.2-7.9 4.6-1.3 8-4 10.2-7.9Z" fill="#e7352b" opacity=".85" />
    <path d="M20 36c1.7 3.1 4.4 5.2 8 6.2-3.6 1-6.3 3.1-8 6.2-1.7-3.1-4.4-5.2-8-6.2 3.6-1 6.3-3.1 8-6.2Z" fill="#e7352b" opacity=".6" />
  </svg>
);
