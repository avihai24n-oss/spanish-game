import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../game/store";
import { ROUND_SIZE } from "../game/types";
import RaceTrack from "./RaceTrack";
import DuoButton from "./ui/DuoButton";

export default function WaitingScreen() {
  const player = useGameStore((s) => s.player);
  const opponent = useGameStore((s) => s.opponent);
  const goHome = useGameStore((s) => s.goHome);
  const finishRound = useGameStore((s) => s.finishRound);

  const remaining = Math.max(0, ROUND_SIZE - opponent.progress);
  const opponentDone = opponent.finished || opponent.progress >= ROUND_SIZE;
  const opponentAccuracy =
    opponent.progress > 0
      ? Math.round((opponent.correctCount / opponent.progress) * 100)
      : 0;

  useEffect(() => {
    if (!player.finished || !opponentDone) return;
    const t = setTimeout(finishRound, 0);
    return () => clearTimeout(t);
  }, [finishRound, opponentDone, player.finished]);

  return (
    <main className="screen-shell flex items-center justify-center">
      <section className="panel w-full max-w-2xl overflow-hidden rounded-[2rem] p-6 text-center sm:p-8">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-duo-green/30 bg-duo-greenLight text-5xl shadow-card"
        >
          🏁
        </motion.div>

        <h1 className="mt-5 text-4xl font-black text-duo-ink">
          סיימת ראשון!
        </h1>
        <p className="mx-auto mt-2 max-w-md text-lg font-bold text-duo-gray">
          מחכים ש{opponent.name} יסיים/תסיים את הסיבוב. התוצאה הסופית תופיע רק אחרי ששני השחקנים סיימו.
        </p>

        <div className="mx-auto mt-7 w-full max-w-lg">
          <RaceTrack player={player} opponent={opponent} />
        </div>

        <div className="mx-auto mt-5 grid w-full max-w-lg gap-3 sm:grid-cols-3">
          <WaitingStat label="הניקוד שלך" value={player.score} tone="green" />
          <WaitingStat label="ניקוד יריב" value={opponent.score} tone="purple" />
          <WaitingStat label="נשארו ליריב" value={remaining} suffix="שאלות" tone="gray" />
        </div>

        <div className="mx-auto mt-5 grid w-full max-w-lg gap-3 rounded-[1.4rem] border border-duo-border bg-white/70 p-3 shadow-card sm:grid-cols-2">
          <div className="rounded-2xl border border-duo-green/30 bg-duo-greenLight px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-duo-greenShadow/80">
              אתה
            </p>
            <p className="mt-1 text-2xl font-black text-duo-greenShadow">
              {player.correctCount}/{ROUND_SIZE}
            </p>
            <p className="text-xs font-bold text-duo-gray">
              נכונות · {ROUND_SIZE - player.correctCount} טעויות
            </p>
          </div>
          <div className="rounded-2xl border border-duo-purple/30 bg-duo-purpleLight px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-duo-purple">
              יריב
            </p>
            <p className="mt-1 text-2xl font-black text-duo-purple">
              {opponent.correctCount}/{opponent.progress || ROUND_SIZE}
            </p>
            <p className="text-xs font-bold text-duo-gray">
              דיוק זמני {opponentAccuracy}%
            </p>
          </div>
        </div>

        <motion.div
          className="mx-auto mt-7 flex items-center justify-center gap-2 text-sm font-black text-duo-purple"
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-duo-purple" />
          {opponentDone ? "עוברים למסך התוצאות..." : "היריב עדיין משחק..."}
        </motion.div>

        <div className="mx-auto mt-7 max-w-sm">
          <DuoButton variant="white" size="lg" className="w-full" onClick={goHome}>
            יציאה לתפריט
          </DuoButton>
        </div>
      </section>
    </main>
  );
}

function WaitingStat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone: "green" | "purple" | "gray";
}) {
  const toneClass = {
    green: "border-duo-green/35 bg-duo-greenLight text-duo-greenShadow",
    purple: "border-duo-purple/30 bg-duo-purpleLight text-duo-purple",
    gray: "border-duo-border bg-duo-surface2 text-duo-gray",
  }[tone];

  return (
    <div className={`rounded-2xl border px-3 py-3 shadow-card ${toneClass}`}>
      <p className="text-xs font-black">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums" dir="ltr">
        {value}
      </p>
      {suffix && <p className="text-xs font-bold opacity-80">{suffix}</p>}
    </div>
  );
}
