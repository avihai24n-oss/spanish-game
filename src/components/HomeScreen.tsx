import { motion } from "framer-motion";
import { useGameStore } from "../game/store";
import DuoButton from "./ui/DuoButton";
import { useSound } from "../hooks/useSound";

const stagger = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function HomeScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const openLobby = useGameStore((s) => s.openLobby);
  const stats = useGameStore((s) => s.stats);
  const { play } = useSound();

  return (
    <div className="dotted-bg flex min-h-screen flex-col items-center justify-center px-6 py-10">
      {/* Mascot + logo */}
      <motion.div
        variants={stagger}
        custom={0}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center"
      >
        <motion.div
          className="text-8xl"
          animate={{ y: [0, -10, 0], rotate: [0, -4, 0, 4, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          🦜
        </motion.div>
        <h1
          className="es-text mt-2 text-6xl font-black tracking-tight text-duo-green drop-shadow-[0_3px_0_rgba(88,167,0,0.35)]"
          dir="ltr"
        >
          ¡Vamos!
        </h1>
        <p className="mt-3 text-lg font-bold text-duo-gray">
          מרוץ ספרדית־עברית · מי לומד מהר יותר?
        </p>
      </motion.div>

      {/* Main actions */}
      <div className="mt-10 flex w-full max-w-sm flex-col gap-4">
        <motion.div variants={stagger} custom={1} initial="hidden" animate="show">
          <DuoButton
            variant="green"
            size="xl"
            className="w-full"
            onClick={() => {
              play("click");
              void startGame();
            }}
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-2xl">⚡</span>
              תרגול נגד בוט
            </span>
          </DuoButton>
        </motion.div>

        <motion.div
          variants={stagger}
          custom={2}
          initial="hidden"
          animate="show"
          className="relative"
        >
          <DuoButton
            variant="blue"
            size="xl"
            className="w-full"
            onClick={() => {
              play("click");
              openLobby();
            }}
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-2xl">⚔️</span>
              תחרות עם חבר
            </span>
          </DuoButton>
          <span className="absolute -left-2 -top-2 rounded-full border-b-2 border-duo-goldShadow bg-duo-gold px-2.5 py-0.5 text-xs font-black text-white shadow">
            בקרוב
          </span>
        </motion.div>
      </div>

      {/* Stats row */}
      <motion.div
        variants={stagger}
        custom={3}
        initial="hidden"
        animate="show"
        className="mt-10 flex w-full max-w-sm items-stretch justify-between gap-3"
      >
        <StatChip icon="✨" label="XP" value={stats.totalXp} color="text-duo-gold" />
        <StatChip icon="🎮" label="משחקים" value={stats.gamesPlayed} color="text-duo-blue" />
        <StatChip icon="🏆" label="ניצחונות" value={stats.wins} color="text-duo-green" />
        <StatChip icon="🔥" label="שיא רצף" value={stats.bestCombo} color="text-duo-red" />
      </motion.div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl border-2 border-duo-border bg-white px-2 py-2.5 shadow-card">
      <span className="text-lg">{icon}</span>
      <span className={`text-lg font-black tabular-nums ${color}`}>{value}</span>
      <span className="text-[11px] font-bold text-duo-gray">{label}</span>
    </div>
  );
}
