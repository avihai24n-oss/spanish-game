import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useGameStore } from "../game/store";
import { accuracy } from "../game/scoring";
import { ROUND_SIZE } from "../game/types";
import DuoButton from "./ui/DuoButton";
import { useSound } from "../hooks/useSound";

export default function ResultsScreen() {
  const { player, opponent, questions, answers, xpEarned, bestComboThisRound, startGame, goHome } =
    useGameStore();
  const { play } = useSound();

  const totalQuestions = questions.length || answers.length || ROUND_SIZE;
  const won = player.score > opponent.score;
  const tie = player.score === opponent.score;
  const diff = Math.abs(player.score - opponent.score);
  const acc = accuracy(player.correctCount, totalQuestions);
  const opponentAcc = accuracy(opponent.correctCount, totalQuestions);
  const playerMistakes = Math.max(0, totalQuestions - player.correctCount);
  const opponentMistakes = Math.max(0, totalQuestions - opponent.correctCount);
  const winner = tie ? null : won ? player : opponent;
  const loser = tie ? null : won ? opponent : player;

  useEffect(() => {
    if (!won && !tie) return;
    play("win");
    const end = Date.now() + 900;
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: ["#58CC02", "#8B5CF6", "#FFC800", "#BFA7FF"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: ["#58CC02", "#8B5CF6", "#FFC800", "#BFA7FF"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#58CC02", "#8B5CF6", "#FFC800", "#BFA7FF", "#FF4B4B"],
    });
    frame();
  }, [won, tie, play]);

  return (
    <main className="screen-shell flex items-center justify-center">
      <section className="panel w-full max-w-2xl rounded-[2rem] p-6 text-center sm:p-8">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="text-7xl"
        >
          {won ? "🏆" : tie ? "🤝" : "😅"}
        </motion.div>

        <h1 className="mt-3 text-4xl font-black text-duo-ink">
          {won ? "ניצחון!" : tie ? "תיקו מושלם!" : "הפסד הפעם..."}
        </h1>
        <p className="mt-2 text-lg font-bold text-duo-gray">
          {won
            ? `ניצחת את ${opponent.name} — מהירות + דיוק = אלופים`
            : tie
              ? "שוויון מוחלט בנקודות. סיבוב הכרעה?"
              : `${opponent.name} לקח את הסיבוב הזה. עוד סיבוב ותנצחו!`}
        </p>

        <motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 220, damping: 20 }}
          className="mx-auto mt-6 grid w-full max-w-lg gap-3 rounded-[1.4rem] border border-duo-border bg-white/75 p-3 shadow-card sm:grid-cols-3"
        >
          <ResultPill
            label={tie ? "תוצאה" : "המנצח"}
            value={tie ? "תיקו" : winner?.name ?? ""}
            subValue={tie ? `${player.score} - ${opponent.score}` : `${winner?.score ?? 0} נק׳`}
            tone={tie ? "gold" : "green"}
          />
          <ResultPill
            label={tie ? "פער" : "המפסיד"}
            value={tie ? "0 נק׳" : loser?.name ?? ""}
            subValue={tie ? "אין הפרש" : `${loser?.score ?? 0} נק׳`}
            tone={tie ? "gold" : "gray"}
          />
          <ResultPill
            label="הפרש"
            value={tie ? "0" : `${diff}`}
            subValue={tie ? "נקודות" : `נק׳ לטובת ${winner?.name ?? ""}`}
            tone={won ? "green" : tie ? "gold" : "purple"}
          />
        </motion.div>

        {/* Duel verdict: winner / diff / loser */}
        <div className="mx-auto mt-8 flex w-full max-w-lg items-stretch gap-2 sm:gap-3">
          <DuelCard
            name={player.name}
            avatar={player.avatar}
            score={player.score}
            role={tie ? "tie" : won ? "winner" : "loser"}
            color="green"
          />

          {/* Center column: VS + point gap */}
          <div className="flex min-w-[84px] flex-col items-center justify-center gap-2">
            <span className="text-xl font-black text-duo-gray/70">VS</span>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 300, damping: 16 }}
              className={`flex flex-col items-center rounded-2xl border border-b-4 px-3 py-2 shadow-card ${
                tie
                  ? "border-duo-gold bg-duo-gold/15 text-duo-gold"
                  : won
                    ? "border-duo-green bg-duo-greenLight text-duo-greenShadow"
                    : "border-duo-purple bg-duo-purple/10 text-duo-purple"
              }`}
            >
              <span className="text-[11px] font-black">הפרש</span>
              <span className="text-2xl font-black tabular-nums" dir="ltr">
                {tie ? "0" : `+${diff}`}
              </span>
              <span className="text-[10px] font-bold opacity-75">
                {tie ? "תיקו" : won ? "לטובתך" : `ל${opponent.name}`}
              </span>
            </motion.div>
          </div>

          <DuelCard
            name={opponent.name}
            avatar={opponent.avatar}
            score={opponent.score}
            role={tie ? "tie" : won ? "loser" : "winner"}
            color="purple"
            delay={0.25}
          />
        </div>

        {/* Score gap bars */}
        <div className="mx-auto mt-5 w-full max-w-lg space-y-2">
          <ScoreBar
            label={player.name}
            score={player.score}
            max={Math.max(player.score, opponent.score, 1)}
            colorClass="bg-duo-green"
            delay={1.1}
          />
          <ScoreBar
            label={opponent.name}
            score={opponent.score}
            max={Math.max(player.score, opponent.score, 1)}
            colorClass="bg-duo-purple"
            delay={1.25}
          />
        </div>

        <div className="mx-auto mt-5 grid w-full max-w-lg gap-3 sm:grid-cols-2">
          <AnswerBreakdown
            label={player.name}
            correct={player.correctCount}
            mistakes={playerMistakes}
            accuracy={acc}
            tone="green"
          />
          <AnswerBreakdown
            label={opponent.name}
            correct={opponent.correctCount}
            mistakes={opponentMistakes}
            accuracy={opponentAcc}
            tone="purple"
          />
        </div>

        {/* Stats */}
        <div className="mx-auto mt-6 grid w-full max-w-lg grid-cols-3 gap-3">
          <StatBox label="דיוק שלך" value={`${acc}%`} icon="🎯" delay={1.4} />
          <StatBox label="XP הרווחת" value={`+${xpEarned}`} icon="✨" delay={1.5} />
          <StatBox label="שיא רצף" value={`×${bestComboThisRound}`} icon="🔥" delay={1.6} />
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-3">
          <DuoButton variant="green" size="xl" className="w-full" onClick={() => void startGame()}>
            שחק שוב 🔁
          </DuoButton>
          <DuoButton variant="white" size="lg" className="w-full" onClick={goHome}>
            חזרה לתפריט
          </DuoButton>
        </div>
      </section>
    </main>
  );
}

function ResultPill({
  label,
  value,
  subValue,
  tone,
}: {
  label: string;
  value: string;
  subValue: string;
  tone: "green" | "purple" | "gold" | "gray";
}) {
  const toneClass = {
    green: "border-duo-green/35 bg-duo-greenLight text-duo-greenShadow",
    purple: "border-duo-purple/30 bg-duo-purpleLight text-duo-purple",
    gold: "border-duo-gold/40 bg-duo-gold/15 text-duo-ink",
    gray: "border-duo-border bg-duo-surface2 text-duo-gray",
  }[tone];

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] opacity-75">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black">{value}</p>
      <p className="text-xs font-bold opacity-80">{subValue}</p>
    </div>
  );
}

/** Score number that counts up from its previous value. */
function CountUp({ value, delay = 400 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now() + delay;
    const duration = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (value - from) * eased);
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);

  return <span className="tabular-nums">{display}</span>;
}

function DuelCard({
  name,
  avatar,
  score,
  role,
  color,
  delay = 0.1,
}: {
  name: string;
  avatar: string;
  score: number;
  role: "winner" | "loser" | "tie";
  color: "green" | "purple";
  delay?: number;
}) {
  const isWinner = role === "winner";
  const accent =
    color === "green"
      ? "border-duo-green text-duo-greenShadow"
      : "border-duo-purple text-duo-purple";

  return (
    <motion.div
      initial={{ y: 28, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: isWinner ? 1.04 : role === "loser" ? 0.97 : 1,
      }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 20 }}
      className={`relative flex flex-1 flex-col items-center rounded-2xl border border-b-4 px-3 py-5 shadow-card ${
        role === "loser"
          ? "border-duo-border bg-white/60 text-duo-gray opacity-80 saturate-50"
          : `bg-white/90 ${accent}`
      }`}
    >
      {/* Crown drops onto the winner */}
      {isWinner && (
        <motion.span
          initial={{ y: -34, opacity: 0, rotate: -18 }}
          animate={{ y: 0, opacity: 1, rotate: -12 }}
          transition={{ delay: delay + 0.5, type: "spring", stiffness: 320, damping: 12 }}
          className="absolute -top-5 right-3 text-3xl drop-shadow"
        >
          👑
        </motion.span>
      )}

      <span className={`text-4xl ${role === "loser" ? "grayscale" : ""}`}>{avatar}</span>
      <span className="mt-1 text-sm font-bold text-duo-gray">{name}</span>

      <span className="mt-1 text-4xl font-black" dir="ltr">
        <CountUp value={score} delay={delay * 1000 + 400} />
      </span>
      <span className="text-[11px] font-bold text-duo-gray">נקודות</span>

      <span
        className={`mt-2 rounded-full px-3 py-0.5 text-xs font-black ${
          role === "winner"
            ? "bg-duo-gold text-duo-ink shadow"
            : role === "tie"
              ? "bg-duo-gold/25 text-duo-ink"
              : "bg-duo-border/70 text-duo-gray"
        }`}
      >
        {role === "winner" ? "🏆 מנצח" : role === "tie" ? "🤝 תיקו" : "מפסיד"}
      </span>
    </motion.div>
  );
}

function ScoreBar({
  label,
  score,
  max,
  colorClass,
  delay,
}: {
  label: string;
  score: number;
  max: number;
  colorClass: string;
  delay: number;
}) {
  const pct = Math.max(6, Math.round((score / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-right text-xs font-black text-duo-gray">
        {label}
      </span>
      <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-duo-border/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay, duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
          className={`h-full rounded-full ${colorClass}`}
          style={{ float: "inline-start" }}
        />
      </div>
      <span className="w-12 shrink-0 text-left text-sm font-black tabular-nums text-duo-ink" dir="ltr">
        {score}
      </span>
    </div>
  );
}

function AnswerBreakdown({
  label,
  correct,
  mistakes,
  accuracy,
  tone,
}: {
  label: string;
  correct: number;
  mistakes: number;
  accuracy: number;
  tone: "green" | "purple";
}) {
  const toneClass =
    tone === "green"
      ? "border-duo-green/30 bg-duo-greenLight text-duo-greenShadow"
      : "border-duo-purple/30 bg-duo-purpleLight text-duo-purple";

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: tone === "green" ? 1.28 : 1.36, type: "spring", stiffness: 220, damping: 20 }}
      className={`rounded-2xl border px-4 py-3 text-start shadow-card ${toneClass}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-75">
        {label}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <MiniMetric label="צדק" value={correct} />
        <MiniMetric label="טעה" value={mistakes} />
        <MiniMetric label="דיוק" value={`${accuracy}%`} />
      </div>
    </motion.div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white/60 px-2 py-2">
      <p className="text-lg font-black tabular-nums" dir="ltr">
        {value}
      </p>
      <p className="text-[11px] font-bold opacity-75">{label}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  delay,
}: {
  label: string;
  value: string;
  icon: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 20 }}
      className="metric-card flex flex-col items-center"
    >
      <span className="text-xl">{icon}</span>
      <span className="mt-0.5 text-xl font-black tabular-nums" dir="ltr">
        {value}
      </span>
      <span className="text-xs font-bold text-duo-gray">{label}</span>
    </motion.div>
  );
}
