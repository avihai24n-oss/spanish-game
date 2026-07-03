import { motion } from "framer-motion";

interface ProgressBarProps {
  /** 0..1 */
  value: number;
}

/** Thick rounded green lesson progress bar with a subtle moving shine. */
export default function ProgressBar({ value }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-duo-border">
      <motion.div
        className="relative h-full rounded-full bg-duo-green"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
      >
        {/* inner highlight — the classic Duolingo bar sheen */}
        <div className="absolute inset-x-2 top-[3px] h-[5px] rounded-full bg-white/30" />
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="animate-shine absolute top-0 h-full w-1/4 -skew-x-12 bg-white/20" />
        </div>
      </motion.div>
    </div>
  );
}
