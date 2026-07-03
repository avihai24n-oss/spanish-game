import { motion } from "framer-motion";
import type { PlayerState } from "../game/types";
import { ROUND_SIZE } from "../game/types";

interface RaceTrackProps {
  player: PlayerState;
  opponent: PlayerState;
}

function Lane({
  state,
  isPlayer,
}: {
  state: PlayerState;
  isPlayer: boolean;
}) {
  const pct = (state.progress / ROUND_SIZE) * 100;
  return (
    <div className="flex items-center gap-2" dir="ltr">
      <div className="relative h-9 flex-1">
        {/* track line */}
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-duo-border" />
        <div
          className={`absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full transition-all duration-500 ${
            isPlayer ? "bg-duo-green" : "bg-duo-purple"
          }`}
          style={{ width: `${pct}%` }}
        />
        {/* runner avatar */}
        <motion.div
          className={`absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 text-lg shadow-sm ${
            isPlayer
              ? "border-duo-greenShadow bg-duo-greenLight"
              : "border-duo-purpleShadow bg-[#F3E5FF]"
          }`}
          initial={false}
          animate={{ left: `calc(${pct}% - ${(pct / 100) * 36}px)` }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
          {state.avatar}
        </motion.div>
        {/* finish flag */}
        <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-lg">
          🏁
        </span>
      </div>
      <div className="w-20 text-right" dir="rtl">
        <div className="text-[11px] font-bold leading-tight text-duo-gray">
          {state.name}
        </div>
        <div
          className={`text-sm font-black tabular-nums leading-tight ${
            isPlayer ? "text-duo-green" : "text-duo-purple"
          }`}
        >
          {state.score}
        </div>
      </div>
    </div>
  );
}

/** Both players racing along horizontal tracks; progress = questions done. */
export default function RaceTrack({ player, opponent }: RaceTrackProps) {
  return (
    <div className="rounded-2xl border-2 border-duo-border bg-white px-4 py-2.5">
      <div className="flex flex-col gap-1.5">
        <Lane state={player} isPlayer />
        <Lane state={opponent} isPlayer={false} />
      </div>
    </div>
  );
}
