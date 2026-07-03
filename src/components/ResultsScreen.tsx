import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useGameStore } from "../game/store";
import DuoButton from "./ui/DuoButton";
import { useSound } from "../hooks/useSound";

export default function ResultsScreen() {
  const {
    player,
    opponent,
    startGame,
    goHome,
    mode,
    requestRematch,
    rematchRequested,
    opponentWantsRematch,
    opponentLeft,
    createDuel,
  } = useGameStore();
  const { play } = useSound();

  const won = player.score > opponent.score;
  const tie = player.score === opponent.score;
  const diff = Math.abs(player.score - opponent.score);
  const winner = tie ? null : won ? player : opponent;
  const loser = tie ? null : won ? opponent : player;

  useEffect(() => {
    if (!won && !tie) return;
    play("win");
    confetti({
      particleCount: 90,
      spread: 84,
      origin: { y: 0.58 },
      colors: ["#58CC02", "#8B5CF6", "#FFC800", "#BFA7FF"],
    });
  }, [won, tie, play]);

  const title = tie ? "תיקו" : won ? "ניצחת" : "הפסדת";
  const subtitle = tie
    ? "שני השחקנים סיימו עם אותו ניקוד"
    : `${winner?.name ?? ""} ניצח/ה בהפרש של ${diff} נקודות`;

  return (
    <main className="screen-shell flex items-center justify-center">
      <motion.section
        initial={{ y: 14, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
        className="panel w-full max-w-xl rounded-[1.75rem] p-5 text-center sm:p-7"
      >
        <ResultEmblem tone={tie ? "tie" : won ? "win" : "loss"} />

        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-duo-purple">
          תוצאה סופית
        </p>
        <h1 className="mt-1 text-4xl font-black leading-tight text-duo-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-bold text-duo-gray sm:text-base">
          {subtitle}
        </p>

        <div className="mx-auto mt-6 grid w-full max-w-md gap-3">
          {tie ? (
            <ScoreRow
              label="תיקו"
              name={`${player.name} / ${opponent.name}`}
              score={player.score}
              tone="tie"
            />
          ) : (
            <>
              <ScoreRow
                label="המנצח"
                name={winner?.name ?? ""}
                score={winner?.score ?? 0}
                tone="winner"
              />
              <ScoreRow
                label="המפסיד"
                name={loser?.name ?? ""}
                score={loser?.score ?? 0}
                tone="loser"
              />
            </>
          )}
        </div>

        <div className="mx-auto mt-4 flex max-w-md items-center justify-between rounded-2xl border border-duo-border bg-white/70 px-4 py-3 shadow-sm">
          <span className="text-sm font-black text-duo-gray">הפרש</span>
          <span className="text-2xl font-black tabular-nums text-duo-ink" dir="ltr">
            {diff}
          </span>
          <span className="text-sm font-bold text-duo-gray">נקודות</span>
        </div>

        {mode === "duel" && opponentLeft && (
          <div className="mx-auto mt-5 max-w-md rounded-2xl border border-duo-gold/40 bg-duo-gold/10 px-4 py-2.5 text-sm font-bold text-duo-ink">
            {opponent.name} התנתק/ה מהמשחק
          </div>
        )}
        {mode === "duel" && !opponentLeft && opponentWantsRematch && !rematchRequested && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mt-5 max-w-md rounded-2xl border border-duo-green/40 bg-duo-greenLight px-4 py-2.5 text-sm font-black text-duo-greenShadow"
          >
            ⚔️ {opponent.name} רוצה עוד סיבוב!
          </motion.div>
        )}

        <div className="mx-auto mt-7 grid w-full max-w-md gap-3 sm:grid-cols-2">
          {mode === "duel" ? (
            opponentLeft ? (
              <DuoButton
                variant="green"
                size="lg"
                className="w-full"
                onClick={() => void createDuel()}
              >
                חדר חדש ⚔️
              </DuoButton>
            ) : (
              <DuoButton
                variant="green"
                size="lg"
                className="w-full"
                disabled={rematchRequested}
                onClick={requestRematch}
              >
                {rematchRequested ? "מחכים ליריב..." : "עוד סיבוב ⚔️"}
              </DuoButton>
            )
          ) : (
            <DuoButton variant="green" size="lg" className="w-full" onClick={() => void startGame()}>
              שחק שוב
            </DuoButton>
          )}
          <DuoButton variant="white" size="lg" className="w-full" onClick={goHome}>
            חזרה לתפריט
          </DuoButton>
        </div>
      </motion.section>
    </main>
  );
}

function ResultEmblem({ tone }: { tone: "win" | "loss" | "tie" }) {
  return (
    <div className={`result-emblem result-emblem-${tone}`} aria-hidden="true">
      <span className="result-ring result-ring-one" />
      <span className="result-ring result-ring-two" />
      <span className="result-core">
        <span className="result-spark result-spark-one" />
        <span className="result-spark result-spark-two" />
        <span className="result-spark result-spark-three" />
      </span>
    </div>
  );
}

function ScoreRow({
  label,
  name,
  score,
  tone,
}: {
  label: string;
  name: string;
  score: number;
  tone: "winner" | "loser" | "tie";
}) {
  const toneClass = {
    winner: "border-duo-green/45 bg-duo-greenLight text-duo-greenShadow",
    loser: "border-duo-border bg-white/70 text-duo-gray",
    tie: "border-duo-gold/45 bg-duo-gold/15 text-duo-ink",
  }[tone];

  return (
    <motion.div
      initial={{ x: 16 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`flex items-center justify-between gap-4 rounded-2xl border border-b-4 px-4 py-3 shadow-card ${toneClass}`}
    >
      <div className="text-start">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] opacity-75">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-black">{name}</p>
      </div>
      <div className="text-left" dir="ltr">
        <p className="text-3xl font-black tabular-nums">{score}</p>
        <p className="text-xs font-bold opacity-75">points</p>
      </div>
    </motion.div>
  );
}
