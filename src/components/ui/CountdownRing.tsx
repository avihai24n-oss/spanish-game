interface CountdownRingProps {
  /** fraction of time remaining, 0..1 */
  fraction: number;
  /** seconds remaining, shown in the middle */
  seconds: number;
}

const SIZE = 52;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

/** Per-question countdown ring — green, then gold, then red as time runs out. */
export default function CountdownRing({ fraction, seconds }: CountdownRingProps) {
  const f = Math.max(0, Math.min(1, fraction));
  const color = f > 0.5 ? "#58CC02" : f > 0.25 ? "#FFC800" : "#FF4B4B";

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - f)}
          style={{ transition: "stroke 0.3s" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums"
        style={{ color }}
      >
        {seconds}
      </span>
    </div>
  );
}
