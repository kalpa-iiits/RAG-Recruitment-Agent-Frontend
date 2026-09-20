/**
 * Lightweight, text-based stand-ins for the employer wordmarks used in the
 * social-proof row. They evoke the real marks without shipping trademarked
 * artwork — swap in licensed SVGs before going live.
 */
import type { CSSProperties } from 'react';

type P = { size?: number };

const wrap = (size: number): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: size,
  fontWeight: 700,
  letterSpacing: '-.02em',
  lineHeight: 1,
});

export const Google = ({ size = 22 }: P) => {
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#4285F4', '#34A853', '#EA4335'];
  return (
    <span style={{ ...wrap(size), gap: 0, fontWeight: 600 }}>
      {'Google'.split('').map((c, i) => (
        <span key={i} style={{ color: colors[i] }}>{c}</span>
      ))}
    </span>
  );
};

export const Amazon = ({ size = 21 }: P) => (
  <span style={{ ...wrap(size), flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <span style={{ fontWeight: 700 }}>amazon</span>
    <svg width={size * 2} height={size * 0.34} viewBox="0 0 60 10" fill="none" aria-hidden>
      <path d="M2 5.4C10 9.4 22 11 34 8.2c4.2-1 8-2.6 11-4.6" stroke="#FF9900" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M41 1.6c3.6.6 5.4 1.6 5 2.9-.2.8-1.2 1.5-2.6 2" stroke="#FF9900" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  </span>
);

export const Microsoft = ({ size = 19 }: P) => (
  <span style={wrap(size)}>
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <rect width="9" height="9" fill="#F25022" />
      <rect x="11" width="9" height="9" fill="#7FBA00" />
      <rect y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
    <span style={{ fontWeight: 600 }}>Microsoft</span>
  </span>
);

export const Meta = ({ size = 21 }: P) => (
  <span style={wrap(size)}>
    <svg width={size * 1.7} height={size} viewBox="0 0 36 20" fill="none" aria-hidden>
      <path d="M3 14.5c0-4.6 2.3-8.5 5.4-8.5 2 0 3.4 1.3 5 3.9l2 3.3c1.6 2.7 2.7 3.9 4.4 3.9 1.9 0 3-1.9 3-4.6 0-3.1-1.3-6.4-3.4-6.4-1.3 0-2.5 1-4 3"
        stroke="#0081FB" strokeWidth="3" strokeLinecap="round" />
      <path d="M8.4 6c3.1 0 5 3.9 5 8.5 0 2.2-.8 3.6-2.2 3.6-1.5 0-2.6-1.6-2.6-4.4C8.6 10.3 10.6 6 15.4 6"
        stroke="#0064E0" strokeWidth="3" strokeLinecap="round" opacity=".9" />
    </svg>
    <span>Meta</span>
  </span>
);

export const Adobe = ({ size = 20 }: P) => (
  <span style={wrap(size)}>
    <svg width={size * 1.15} height={size} viewBox="0 0 23 20" aria-hidden>
      <path d="M8.6 0H0v20L8.6 0Z" fill="#EB1000" />
      <path d="M14.4 0H23v20L14.4 0Z" fill="#EB1000" />
      <path d="M11.5 7.4 17 20h-3.6l-1.6-4.1H7.9l3.6-8.5Z" fill="#EB1000" />
    </svg>
    <span>Adobe</span>
  </span>
);

export const Netflix = ({ size = 21 }: P) => (
  <span style={{ ...wrap(size), color: '#E50914', fontWeight: 800, letterSpacing: '-.04em' }}>NETFLIX</span>
);

export const Uber = ({ size = 22 }: P) => (
  <span style={{ ...wrap(size), fontWeight: 700, letterSpacing: '-.03em' }}>Uber</span>
);

export const Salesforce = ({ size = 18 }: P) => (
  <span style={wrap(size)}>
    <svg width={size * 4.2} height={size * 2.9} viewBox="0 0 84 58" aria-hidden>
      <path d="M34 11a14.5 14.5 0 0 1 23 3A16.5 16.5 0 1 1 63 47H22A17 17 0 1 1 24.8 13.2 14.5 14.5 0 0 1 34 11Z" fill="#00A1E0" />
      <text x="42" y="34.5" textAnchor="middle" fill="#fff" fontSize="15.5" fontWeight="600"
        fontFamily="Inter, sans-serif" letterSpacing="-.4">salesforce</text>
    </svg>
  </span>
);

export const PayPal = ({ size = 21 }: P) => (
  <span style={wrap(size)}>
    <svg width={size} height={size * 1.05} viewBox="0 0 20 21" fill="none" aria-hidden>
      <path d="M3.6 20 6.4 1h6.2c3.4 0 5.4 1.8 4.9 5-.5 3.4-3 5.2-6.6 5.2H8.2L7 20H3.6Z" fill="#009CDE" />
      <path d="M1 17 3.8 0H10c3.4 0 5.4 1.8 4.9 5-.5 3.4-3 5.2-6.6 5.2H5.6L4.4 17H1Z" fill="#003087" />
    </svg>
    <span>
      <span style={{ color: '#003087' }}>Pay</span>
      <span style={{ color: '#009CDE' }}>Pal</span>
    </span>
  </span>
);
