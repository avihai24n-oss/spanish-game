import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../game/store";
import { MCQ_TIME_MS, ROUND_SIZE, questionTimeMs } from "../game/types";
import ProgressBar from "./ui/ProgressBar";
import CountdownRing from "./ui/CountdownRing";
import RaceTrack from "./RaceTrack";
import McqExercise from "./exercises/McqExercise";
import SentenceExercise from "./exercises/SentenceExercise";
import { useSound } from "../hooks/useSound";

export default function GameScreen() {
  const {
    questions,
    questionIndex,
    phase,
    lastCorrect,
    lastPoints,
    combo,
    hearts,
    player,
    opponent,
    submitAnswer,
    nextQuestion,
    goHome,
  } = useGameStore();
  const { play } = useSound();

  const question = questions[questionIndex];
  // Sentence questions get a longer clock than MCQ
  const timeLimit = question ? questionTimeMs(question) : MCQ_TIME_MS;
  const [remainingMs, setRemainingMs] = useState(timeLimit);
  const startRef = useRef(performance.now());

  // Per-question countdown (rAF for a smooth ring)
  useEffect(() => {
    if (phase !== "answering") return;
    startRef.current = performance.now();
    setRemainingMs(timeLimit);
    let raf = 0;
    let done = false;
    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const rem = Math.max(0, timeLimit - elapsed);
      setRemainingMs(rem);
      if (rem <= 0 && !done) {
        done = true;
        submitAnswer(false, timeLimit); // timeout = wrong
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, questionIndex, timeLimit, submitAnswer]);

  // Feedback: sound + auto-advance (it's a race — no waiting around)
  useEffect(() => {
    if (phase !== "feedback") return;
    play(lastCorrect ? (combo >= 3 ? "combo" : "correct") : "wrong");
    const t = setTimeout(nextQuestion, lastCorrect ? 1200 : 2600);
    return () => clearTimeout(t);
  }, [phase, lastCorrect, combo, nextQuestion, play]);

  useEffect(() => {
    if (question || questions.length === 0) return;
    const t = setTimeout(nextQuestion, 0);
    return () => clearTimeout(t);
  }, [question, questions.length, nextQuestion]);

  const handleAnswer = (correct: boolean) => {
    const elapsed = performance.now() - startRef.current;
    submitAnswer(correct, Math.min(elapsed, timeLimit));
  };

  if (!question) {
    return (
      <main className="screen-shell flex items-center justify-center">
        <section className="panel w-full max-w-md rounded-[2rem] p-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-greenLight text-4xl">
            🏁
          </div>
          <h1 className="mt-4 text-3xl font-black text-duo-ink">
            מסיימים סיבוב...
          </h1>
          <p className="mt-2 text-sm font-bold text-duo-gray">
            מחשבים את התוצאה ומעבירים למסך הסיום.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="screen-shell pb-36">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col">
      {/* Header: quit, progress, hearts */}
      <div className="panel sticky top-4 z-10 flex items-center gap-3 rounded-[1.35rem] px-3 py-3">
        <button
          onClick={goHome}
          aria-label="יציאה"
          className="rounded-xl px-2 py-1 text-2xl font-black text-duo-gray transition-colors hover:bg-duo-border/50"
        >
          ✕
        </button>
        <div className="flex-1">
          <ProgressBar value={player.progress / ROUND_SIZE} />
        </div>
        <div className="flex items-center gap-1 rounded-full bg-duo-redLight px-3 py-1 text-lg font-black text-duo-red">
          <span>❤️</span>
          <span className="tabular-nums">{hearts}</span>
        </div>
      </div>

      {/* Race track */}
      <div className="mt-3">
        <RaceTrack player={player} opponent={opponent} />
      </div>

      {/* Timer + combo + score row */}
      <div className="mt-4 flex items-center justify-between rounded-[1.35rem] border border-duo-border bg-white/65 px-4 py-3 shadow-sm backdrop-blur">
        <CountdownRing
          fraction={phase === "answering" ? remainingMs / timeLimit : 0}
          seconds={Math.ceil(remainingMs / 1000)}
        />
        <AnimatePresence>
          {combo >= 2 && (
            <motion.div
              key={`combo-${combo}`}
              initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="rounded-full border border-white/70 bg-duo-gold px-3 py-1 text-sm font-black text-duo-ink shadow"
            >
              🔥 רצף ×{combo}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="text-left" dir="ltr">
          <span className="text-2xl font-black tabular-nums text-duo-green">
            {player.score}
          </span>
          <span className="ms-1 text-xs font-bold text-duo-gray">נק׳</span>
        </div>
      </div>

      {/* Question — keyed remount (no exit animation: an interrupted exit
          could stall AnimatePresence and leave the question area blank) */}
      <div className="mt-6 flex-1">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {question.kind === "mcq" ? (
            <McqExercise
              key={question.id}
              question={question}
              revealed={phase === "feedback"}
              onAnswer={handleAnswer}
            />
          ) : (
            <SentenceExercise
              key={question.id}
              question={question}
              revealed={phase === "feedback"}
              onAnswer={handleAnswer}
            />
          )}
        </motion.div>
      </div>

      {/* Feedback banner */}
      <AnimatePresence>
        {phase === "feedback" && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className={`fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur-xl ${
              lastCorrect
                ? "border-duo-green/30 bg-duo-greenLight/95"
                : "border-duo-red/25 bg-duo-redLight/95"
            }`}
          >
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-5">
              <div className="flex items-center gap-3">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-black text-white ${
                    lastCorrect ? "bg-duo-green" : "bg-duo-red"
                  }`}
                >
                  {lastCorrect ? "✓" : "✗"}
                </motion.span>
                <div>
                  <p
                    className={`text-xl font-black ${
                      lastCorrect ? "text-duo-greenShadow" : "text-duo-red"
                    }`}
                  >
                    {lastCorrect ? "מעולה!" : "אופס, לא נכון"}
                  </p>
                  {lastCorrect && (
                    <p className="text-sm font-bold text-duo-greenShadow/80">
                      מהירות משתלמת — ממשיכים!
                    </p>
                  )}
                </div>
              </div>
              {lastCorrect && (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  className="text-2xl font-black tabular-nums text-duo-green"
                  dir="ltr"
                >
                  +{lastPoints}
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </main>
  );
}
