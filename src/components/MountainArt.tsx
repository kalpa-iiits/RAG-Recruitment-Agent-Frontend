/** Decorative backdrop for the login panel — a summit with a trail to it. */
export default function MountainArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 470" fill="none" aria-hidden preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6b3ad" />
          <stop offset="100%" stopColor="#fde0dd" />
        </linearGradient>
        <linearGradient id="ridgeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fac9c4" />
          <stop offset="100%" stopColor="#fdeceb" />
        </linearGradient>
      </defs>

      <circle cx="404" cy="150" r="96" fill="#fdd9d6" opacity=".55" />

      {/* far ridge */}
      <path d="M0 470V330l92-74 78 58 96-96 82 66 106-104 146 130v160H0Z" fill="#fce0dd" opacity=".75" />

      {/* main summit */}
      <path d="M180 470 404 118l216 352H180Z" fill="url(#peakGrad)" />
      <path d="M404 118 486 246l-54 26-38-44-44 28-30-36 84-102Z" fill="#fff" opacity=".45" />

      {/* foreground ridge */}
      <path d="M0 470 148 268l104 132 62-46 128 116H0Z" fill="url(#ridgeGrad)" />

      {/* trail to the top */}
      <path
        d="M236 470c34-42 92-46 104-78s-42-52-26-84c14-28 66-26 78-52 8-18-8-34-2-48"
        stroke="#fff"
        strokeWidth="19"
        strokeLinecap="round"
        fill="none"
        opacity=".88"
      />

      {/* summit flag */}
      <path d="M404 124v-46" stroke="#b9413a" strokeWidth="4" strokeLinecap="round" />
      <path d="M404 78h40l-11 14 11 14h-40V78Z" fill="#e7352b" />
    </svg>
  );
}
