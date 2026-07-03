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
    <main className="screen-shell flex items-center">
      <div className="app-wrap grid min-h-[calc(100vh-4rem)] items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <motion.section
          variants={stagger}
          custom={0}
          initial="hidden"
          animate="show"
          className="text-center lg:text-start"
        >
          <span className="eyebrow">Spanish sprint</span>
          <h1
            className="es-text mt-5 text-6xl font-black leading-none tracking-tight text-duo-green drop-shadow-[0_4px_0_rgba(71,167,0,0.22)] sm:text-7xl"
            dir="ltr"
          >
            ¡Vamos!
          </h1>
          <p className="mt-5 max-w-xl text-2xl font-black leading-tight text-duo-ink sm:text-3xl lg:mx-0">
            מרוץ ספרדית־עברית שנראה ומרגיש כמו משחק אמיתי.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-base font-bold text-duo-gray sm:text-lg lg:mx-0">
            תרגול מהיר, ניקוד חי, רצפים, ולוח תוצאות נקי שאפשר לבנות עליו בהמשך.
          </p>

          <div className="mx-auto mt-8 grid w-full max-w-md gap-4 lg:mx-0 lg:max-w-lg lg:grid-cols-2">
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
                variant="purple"
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
              <span className="absolute -left-2 -top-2 rounded-full border border-white/70 bg-duo-gold px-2.5 py-0.5 text-xs font-black text-duo-ink shadow">
                בקרוב
              </span>
            </motion.div>
          </div>
        </motion.section>

        <motion.aside
          variants={stagger}
          custom={3}
          initial="hidden"
          animate="show"
          className="panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7"
        >
          <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-duo-purple/15 blur-2xl" />
          <div className="absolute -bottom-14 -right-14 h-44 w-44 rounded-full bg-duo-green/15 blur-2xl" />

          <div className="relative rounded-[1.5rem] border border-duo-border bg-white/75 p-5 text-center shadow-card">
            <motion.div
              className="text-7xl"
              animate={{ y: [0, -10, 0], rotate: [0, -4, 0, 4, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              🦜
            </motion.div>
            <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-duo-purple">
              ready to race
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatChip icon="✨" label="XP" value={stats.totalXp} color="text-duo-gold" />
              <StatChip
                icon="🎮"
                label="משחקים"
                value={stats.gamesPlayed}
                color="text-duo-purple"
              />
              <StatChip
                icon="🏆"
                label="ניצחונות"
                value={stats.wins}
                color="text-duo-green"
              />
              <StatChip
                icon="🔥"
                label="שיא רצף"
                value={stats.bestCombo}
                color="text-duo-red"
              />
            </div>
          </div>
        </motion.aside>
      </div>
    </main>
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
    <div className="metric-card flex flex-col items-center">
      <span className="text-lg">{icon}</span>
      <span className={`text-lg font-black tabular-nums ${color}`}>{value}</span>
      <span className="text-[11px] font-bold text-duo-gray">{label}</span>
    </div>
  );
}
