import { useState } from "react";
import { motion } from "framer-motion";
import type { McqQuestion } from "../../game/types";

interface McqExerciseProps {
  question: McqQuestion;
  revealed: boolean;
  onAnswer: (correct: boolean) => void;
}

/**
 * MCQ exercise, both directions:
 *  he-to-es — Hebrew word shown big, 4 Spanish option cards (LTR)
 *  es-to-he — Spanish word shown big, 4 Hebrew option cards (RTL)
 * Tapping an option answers immediately (race mode — speed counts).
 */
export default function McqExercise({
  question,
  revealed,
  onAnswer,
}: McqExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const toSpanish = question.direction === "he-to-es";

  const choose = (i: number) => {
    if (revealed || selected !== null) return;
    setSelected(i);
    onAnswer(i === question.correctIndex);
  };

  return (
    <section className="panel rounded-[1.4rem] p-4 sm:rounded-[1.7rem] sm:p-7">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.14em] text-duo-purple">
          {toSpanish ? "איך אומרים בספרדית?" : "מה הפירוש בעברית?"}
        </p>
        <h2
          className={`mt-2 text-3xl font-black leading-tight text-duo-ink sm:mt-3 sm:text-4xl ${
            toSpanish ? "" : "es-text"
          }`}
          dir={toSpanish ? "rtl" : "ltr"}
        >
          {question.prompt}
        </h2>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIndex;
          const isSelected = i === selected;

          let stateClasses =
            "border-duo-border bg-white/85 hover:bg-duo-surface2 hover:-translate-y-0.5";
          if (revealed && isCorrect) {
            stateClasses =
              "border-duo-green bg-duo-greenLight text-duo-greenShadow animate-pop";
          } else if (revealed && isSelected && !isCorrect) {
            stateClasses = "border-duo-red bg-duo-redLight text-duo-red animate-shake";
          } else if (isSelected) {
            stateClasses = "border-duo-purple bg-duo-purpleLight text-duo-purpleShadow";
          } else if (revealed) {
            stateClasses = "border-duo-border bg-white opacity-50";
          }

          return (
            <motion.button
              key={i}
              onClick={() => choose(i)}
              disabled={revealed}
              whileTap={revealed ? undefined : { scale: 0.97 }}
              className={`relative rounded-2xl border border-b-4 px-4 py-3 text-lg font-extrabold shadow-card transition-all duration-150 sm:px-5 sm:py-4 sm:text-xl ${stateClasses} ${
                toSpanish ? "es-text" : ""
              }`}
              dir={toSpanish ? "ltr" : "rtl"}
            >
              {opt}
              {revealed && isCorrect && (
                <span className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-duo-green text-sm font-black text-white shadow">
                  ✓
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
