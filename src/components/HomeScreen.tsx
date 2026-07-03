import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useGameStore } from "../game/store";
import { ALL_LEVELS, LEVEL_LABELS } from "../game/types";
import DuoButton from "./ui/DuoButton";
import { useSound } from "../hooks/useSound";
import { Avatar, IconCards, IconPlay, IconSwords, LevelIcon } from "./ui/icons";

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
  const openFlashcards = useGameStore((s) => s.openFlashcards);
  const stats = useGameStore((s) => s.stats);
  const profile = useGameStore((s) => s.profile);
  const { play } = useSound();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="screen-shell flex items-center overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-sm flex-col sm:max-w-5xl">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="פתיחת תפריט"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-duo-border bg-white/80 text-duo-ink shadow-card"
          >
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-2xl border border-duo-border bg-white/70 py-1.5 pe-3 ps-1.5 text-sm font-black text-duo-ink shadow-sm">
              {profile ? (
                <>
                  <Avatar id={profile.avatar} className="h-6 w-6" />
                  {profile.name}
                </>
              ) : (
                "אורח"
              )}
            </div>
            <div className="rounded-2xl border border-duo-border bg-white/70 px-3 py-1.5 text-sm font-black text-duo-greenShadow shadow-sm">
              {stats.totalXp} XP
            </div>
          </div>
        </header>

        <motion.section
          variants={stagger}
          custom={0}
          initial="hidden"
          animate="show"
          className="flex w-full flex-1 flex-col items-center justify-center overflow-hidden text-center"
        >
          <h1
            className="es-text max-w-full text-[3.85rem] font-black leading-none tracking-tight text-duo-green drop-shadow-[0_6px_0_rgba(71,167,0,0.2)] sm:text-8xl"
            dir="ltr"
          >
            ¡Vamos!
          </h1>
          <p className="mt-3 max-w-[18rem] text-base font-black leading-snug text-duo-ink sm:max-w-none sm:text-lg">
            ספרדית בעברית. מהר. נקי. משחקי.
          </p>

          <motion.div
            variants={stagger}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-8 w-full max-w-[21rem] px-1 sm:max-w-md"
          >
            <LevelPicker />
          </motion.div>

          <div className="mt-4 grid w-full max-w-[21rem] gap-3 px-1 sm:max-w-md">
            <motion.div variants={stagger} custom={2} initial="hidden" animate="show">
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
                  <IconPlay className="h-6 w-6" />
                  תרגול נגד בוט
                </span>
              </DuoButton>
            </motion.div>

            <motion.div
              variants={stagger}
              custom={3}
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
                  <IconSwords className="h-6 w-6" />
                  דוקרב עם חבר
                </span>
              </DuoButton>
              <span className="absolute -left-2 -top-2 rounded-full border border-white/70 bg-duo-gold px-2.5 py-0.5 text-xs font-black text-duo-ink shadow">
                חדש
              </span>
            </motion.div>

            <motion.div variants={stagger} custom={4} initial="hidden" animate="show">
              <DuoButton
                variant="blue"
                size="xl"
                className="w-full"
                onClick={() => {
                  play("click");
                  openFlashcards();
                }}
              >
                <span className="flex items-center justify-center gap-3">
                  <IconCards className="h-6 w-6" />
                  תרגול מילים
                </span>
              </DuoButton>
            </motion.div>
          </div>
        </motion.section>

        <ProfileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </main>
  );
}

function LevelPicker() {
  const selectedLevels = useGameStore((s) => s.selectedLevels);
  const toggleLevel = useGameStore((s) => s.toggleLevel);
  const setLevels = useGameStore((s) => s.setLevels);
  const { play } = useSound();

  const allSelected = selectedLevels.length === ALL_LEVELS.length;

  return (
    <div className="rounded-2xl border border-duo-border bg-white/70 p-3 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-duo-gray">
          רמת קושי
        </p>
        <button
          type="button"
          onClick={() => {
            play("click");
            setLevels([...ALL_LEVELS]);
          }}
          className={`rounded-full px-2.5 py-0.5 text-xs font-black transition-colors ${
            allSelected
              ? "bg-duo-purple text-white"
              : "bg-duo-border/60 text-duo-gray"
          }`}
        >
          הכל
        </button>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {ALL_LEVELS.map((level) => {
          const active = selectedLevels.includes(level);
          return (
            <button
              key={level}
              type="button"
              aria-pressed={active}
              onClick={() => {
                play("click");
                toggleLevel(level);
              }}
              className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2 text-xs font-black transition-all ${
                active
                  ? "border-duo-green bg-duo-green/10 text-duo-greenShadow"
                  : "border-duo-border bg-white/60 text-duo-gray opacity-70"
              }`}
            >
              <LevelIcon level={level} className={`h-5 w-5 ${active ? "" : "grayscale opacity-80"}`} />
              {LEVEL_LABELS[level]}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] font-bold text-duo-gray">
        אפשר לשלב כמה רמות — השאלות יגיעו מכולן
      </p>
    </div>
  );
}

function ProfileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stats = useGameStore((s) => s.stats);
  const openLobby = useGameStore((s) => s.openLobby);
  const startGame = useGameStore((s) => s.startGame);
  const openFlashcards = useGameStore((s) => s.openFlashcards);
  const profile = useGameStore((s) => s.profile);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="סגירת תפריט"
            className="fixed inset-0 z-40 bg-duo-ink/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-[86vw] max-w-sm border-l border-duo-border bg-duo-surface px-5 py-6 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-duo-purple">
                  הפרופיל שלי
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-duo-ink">
                  {profile ? (
                    <>
                      <Avatar id={profile.avatar} className="h-8 w-8" />
                      {profile.name}
                    </>
                  ) : (
                    "אורח"
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-duo-border/70 text-xl font-black text-duo-gray"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <StatChip label="ניקוד" value={stats.totalXp} color="text-duo-green" />
              <StatChip label="משחקים" value={stats.gamesPlayed} color="text-duo-purple" />
              <StatChip label="ניצחונות" value={stats.wins} color="text-duo-greenShadow" />
              <StatChip label="שיא רצף" value={stats.bestCombo} color="text-duo-red" />
            </div>

            <div className="mt-6 space-y-2">
              <MenuAction label="תרגול נגד בוט" onClick={() => void startGame()} />
              <MenuAction label="תרגול מילים" onClick={openFlashcards} />
              <MenuAction label="דוקרב עם חבר" onClick={openLobby} />
              <MenuAction
                label="החלפת שם משתמש"
                onClick={() =>
                  useGameStore.setState({ screen: "profile", pendingRoomId: null })
                }
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function MenuAction({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-duo-border bg-white/75 px-4 py-3 text-start text-base font-black text-duo-ink shadow-sm"
    >
      <span>{label}</span>
      <span className="text-duo-purple">‹</span>
    </button>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="metric-card flex flex-col items-center">
      <span className={`text-lg font-black tabular-nums ${color}`}>{value}</span>
      <span className="text-[11px] font-bold text-duo-gray">{label}</span>
    </div>
  );
}
