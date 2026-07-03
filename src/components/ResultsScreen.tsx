import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useGameStore } from "../game/store";
import { accuracy } from "../game/scoring";
import { ROUND_SIZE } from "../game/types";
import DuoButton from "./ui/DuoButton";
import { useSound } from "../hooks/useSound";

export default function ResultsScreen() {
  const { player, opponent, answers, xpEarned, bestComboThisRound, startGame, goHome } =
    useGameStore();
  const { play } = useSound();

  const won = player.score > opponent.score;
  const tie = player.score === opponent.score;
  const acc = accuracy(player.correctCount, answers.length || ROUND_SIZE);

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
        colors: ["#58CC02", "#1CB0F6", "#FFC800", "#CE82FF"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: ["#58CC02", "#1CB0F6", "#FFC800", "#CE82FF"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#58CC02", "#1CB0F6", "#FFC800", "#CE82FF", "#FF4B4B"],
    });
    frame();
  }, [won, tie, play]);

  return (
    <div className="dotted-bg flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="text-7xl"
      >
        {won ? "🏆" : tie ? "🤝" : "😅"}
      </motion.div>

      <h1 className="mt-3 text-4xl font-black">
        {won ? "ניצחון!" : tie ? "תיקו!" : "הבוט ניצח הפעם"}
      </h1>
      <p className="mt-2 text-lg font-bold text-duo-gray">
        {won ? "מהירות + דיוק = אלופים" : "עוד סיבוב ותנצחו!"}
      </p>

      {/* Score duel */}
      <div className="mt-8 flex w-full max-w-md items-stretch gap-3">
        <ScoreCard
          label={player.name}
          avatar={player.avatar}
          score={player.score}
          highlight={won || tie}
          color="green"
        />
        <div className="flex items-center text-2xl font-black text-duo-gray">
          vs
        </div>
        <ScoreCard
          label={opponent.name}
          avatar={opponent.avatar}
          score={opponent.score}
          highlight={!won && !tie}
          color="purple"
        />
      </div>

      {/* Stats */}
      <div className="mt-5 grid w-full max-w-md grid-cols-3 gap-3">
        <StatBox label="דיוק" value={`${acc}%`} icon="🎯" delay={0.15} />
        <StatBox label="XP הרווחת" value={`+${xpEarned}`} icon="✨" delay={0.25} />
        <StatBox label="שיא רצף" value={`×${bestComboThisRound}`} icon="🔥" delay={0.35} />
      </div>

      <div className="mt-10 flex w-full max-w-md flex-col gap-3">
        <DuoButton variant="green" size="xl" className="w-full" onClick={() => void startGame()}>
          שחק שוב 🔁
        </DuoButton>
        <DuoButton variant="white" size="lg" className="w-full" onClick={goHome}>
          חזרה לתפריט
        </DuoButton>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  avatar,
  score,
  highlight,
  color,
}: {
  label: string;
  avatar: string;
  score: number;
  highlight: boolean;
  color: "green" | "purple";
}) {
  const colorClasses =
    color === "green"
      ? "border-duo-green text-duo-green"
      : "border-duo-purple text-duo-purple";
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 20 }}
      className={`flex flex-1 flex-col items-center rounded-2xl border-2 border-b-4 bg-white px-4 py-4 ${
        highlight ? colorClasses : "border-duo-border text-duo-gray"
      }`}
    >
      <span className="text-3xl">{avatar}</span>
      <span className="mt-1 text-sm font-bold text-duo-gray">{label}</span>
      <span className="text-3xl font-black tabular-nums">{score}</span>
    </motion.div>
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
      className="flex flex-col items-center rounded-2xl border-2 border-duo-border bg-white px-2 py-3 shadow-card"
    >
      <span className="text-xl">{icon}</span>
      <span className="mt-0.5 text-xl font-black tabular-nums" dir="ltr">
        {value}
      </span>
      <span className="text-xs font-bold text-duo-gray">{label}</span>
    </motion.div>
  );
}
