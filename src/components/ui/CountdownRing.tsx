interface CountdownRingProps {
  /** fraction of time remaining, 0..1 */
  fraction: number;
  /** seconds remaining, shown in the middle */
  seconds: number;
  size?: number;
}

const STROKE = 5;

/** Per-question countdown ring — green, then purple, then red as time runs out. */
export default function CountdownRing({ fraction, seconds, size = 56 }: CountdownRingProps) {
  const stroke = size < 48 ? 4 : STROKE;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const f = Math.max(0, Math.min(1, fraction));
  const color = f > 0.5 ? "#58CC02" : f > 0.25 ? "#8B5CF6" : "#FF4B4B";

  return (
    <div
      className="relative rounded-full bg-white/75 shadow-sm"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#DCE4D5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - f)}
          style={{ transition: "stroke 0.3s" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-black tabular-nums sm:text-sm"
        style={{ color }}
      >
        {seconds}
      </span>
    </div>
  );
}
