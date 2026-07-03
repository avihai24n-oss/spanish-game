import { motion } from "framer-motion";
import type { PlayerState } from "../game/types";
import { ROUND_SIZE } from "../game/types";
import { Avatar, IconFlag } from "./ui/icons";

interface RaceTrackProps {
  player: PlayerState;
  opponent: PlayerState;
  compact?: boolean;
}

function Lane({
  state,
  isPlayer,
  compact = false,
}: {
  state: PlayerState;
  isPlayer: boolean;
  compact?: boolean;
}) {
  const pct = (state.progress / ROUND_SIZE) * 100;
  return (
    <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2"}`} dir="ltr">
      <div className={`relative flex-1 ${compact ? "h-5" : "h-9"}`}>
        {/* track line */}
        <div
          className={`absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-duo-border/80 shadow-inner ${
            compact ? "h-1.5" : "h-2"
          }`}
        />
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ${
            isPlayer ? "bg-duo-green" : "bg-duo-purple"
          } ${compact ? "h-1.5" : "h-2"}`}
          style={{ width: `${pct}%` }}
        />
        {/* runner avatar */}
        <motion.div
          className={`absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-sm ${
            isPlayer
              ? "border-duo-greenShadow bg-duo-greenLight"
              : "border-duo-purpleShadow bg-duo-purpleLight"
          } ${compact ? "h-5 w-5" : "h-9 w-9"}`}
          initial={false}
          animate={{
            left: `calc(${pct}% - ${(pct / 100) * (compact ? 20 : 36)}px)`,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
          <Avatar id={state.avatar} className={compact ? "h-4 w-4" : "h-7 w-7"} />
        </motion.div>
        {/* finish flag */}
        <IconFlag
          className={`absolute -right-1 top-1/2 -translate-y-1/2 ${
            compact ? "h-3.5 w-3.5" : "h-5 w-5"
          }`}
        />
      </div>
      <div className={`${compact ? "w-12" : "w-20"} text-right`} dir="rtl">
        <div className={`${compact ? "text-[9px]" : "text-[11px]"} font-bold leading-tight text-duo-gray`}>
          {state.name}
        </div>
        <div
          className={`${compact ? "text-[11px]" : "text-sm"} font-black tabular-nums leading-tight ${
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
export default function RaceTrack({ player, opponent, compact = false }: RaceTrackProps) {
  return (
    <div className={compact ? "" : "panel rounded-[1.35rem] px-4 py-3"}>
      <div className={`flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
        <Lane state={player} isPlayer compact={compact} />
        <Lane state={opponent} isPlayer={false} compact={compact} />
      </div>
    </div>
  );
}
