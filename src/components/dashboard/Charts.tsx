const R = 46;
const CIRC = 2 * Math.PI * R;

/** Open-bottom arc gauge: green fill over a light-red remainder. */
export function ScoreGauge({ score }: { score: number }) {
  const sweep = 0.68; // 245° of the circle, gap at the bottom
  const arc = CIRC * sweep;
  const filled = arc * Math.min(Math.max(score, 0), 100) / 100;

  return (
    <svg viewBox="0 0 120 120" className="gauge-svg" role="img" aria-label={`ATS score ${score} out of 100`}>
      <circle
        cx="60" cy="60" r={R} fill="none" stroke="#fbcfcb" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${arc} ${CIRC}`} transform="rotate(147 60 60)"
      />
      <circle
        cx="60" cy="60" r={R} fill="none" stroke="#22b356" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRC}`} transform="rotate(147 60 60)"
      />
    </svg>
  );
}

export type DonutSlice = { label: string; value: number; color: string };

/** Ring chart for the skill-strength breakdown. */
export function SkillDonut({ slices, center }: { slices: DonutSlice[]; center: number }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <div className="donut">
      <svg viewBox="0 0 120 120" role="img" aria-label="Skill strength breakdown">
        {total === 0 ? (
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--line)" strokeWidth="15" />
        ) : (
          slices.map((slice) => {
            const length = (slice.value / total) * CIRC;
            const dash = `${length} ${CIRC - length}`;
            const element = (
              <circle
                key={slice.label}
                cx="60" cy="60" r={R} fill="none"
                stroke={slice.color} strokeWidth="15"
                strokeDasharray={dash} strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
              />
            );
            offset += length;
            return element;
          })
        )}
      </svg>
      <span className="donut-center">{center}</span>
    </div>
  );
}

export type RadarAxis = { label: string; value: number };

/**
 * Radar of the user's scores against a full-marks target. Axes are real
 * skills from the analysis; the target ring is the 10/10 the role asks for.
 */
export function RadarChart({ axes, max = 10 }: { axes: RadarAxis[]; max?: number }) {
  // Wider than tall: axis labels sit outside the shape, mostly left and right.
  const width = 340;
  const height = 250;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 72;
  const count = axes.length;
  if (count < 3) return null;

  const point = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return [cx + Math.cos(angle) * radius * ratio, cy + Math.sin(angle) * radius * ratio];
  };

  const polygon = (ratios: number[]) =>
    ratios.map((r, i) => point(i, r).join(',')).join(' ');

  const outer = polygon(axes.map(() => 1));
  const mine = polygon(axes.map((a) => Math.min(Math.max(a.value, 0), max) / max));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="radar" role="img" aria-label="Your scores against the target profile">
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={ring} points={polygon(axes.map(() => ring))} fill="none" stroke="var(--line)" strokeWidth="1" />
      ))}
      {axes.map((axis, i) => {
        const [x, y] = point(i, 1);
        return <line key={axis.label} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />;
      })}

      <polygon points={outer} fill="#94a3b8" fillOpacity=".12" stroke="#94a3b8" strokeWidth="1.5" />
      <polygon points={mine} fill="#e7352b" fillOpacity=".14" stroke="#e7352b" strokeWidth="2" />

      {axes.map((axis, i) => {
        const [x, y] = point(i, 1.26);
        return (
          <text
            key={axis.label}
            x={x} y={y}
            textAnchor={Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end'}
            dominantBaseline="middle"
            className="radar-label"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
