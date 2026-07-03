import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SentenceQuestion } from "../../game/types";
import { checkSentenceAnswer } from "../../game/questionGen";
import DuoButton from "../ui/DuoButton";

interface SentenceExerciseProps {
  question: SentenceQuestion;
  revealed: boolean;
  onAnswer: (correct: boolean) => void;
}

interface Chip {
  /** unique per bank slot (duplicate words stay distinct) */
  key: string;
  text: string;
}

/**
 * Sentence-build exercise, both directions. Tap a word-bank chip to move it
 * into the answer line (with a layout animation); tap a placed chip to send
 * it back. "בדיקה" validates the exact order.
 */
export default function SentenceExercise({
  question,
  revealed,
  onAnswer,
}: SentenceExerciseProps) {
  const toSpanish = question.direction === "he-to-es";
  const [placed, setPlaced] = useState<Chip[]>([]);

  const allChips: Chip[] = question.bank.map((text, i) => ({
    key: `${i}-${text}`,
    text,
  }));
  const placedKeys = new Set(placed.map((c) => c.key));
  const wasCorrect =
    revealed && checkSentenceAnswer(question, placed.map((c) => c.text));

  const place = (chip: Chip) => {
    if (revealed) return;
    setPlaced((p) => [...p, chip]);
  };
  const unplace = (chip: Chip) => {
    if (revealed) return;
    setPlaced((p) => p.filter((c) => c.key !== chip.key));
  };

  const targetDir = toSpanish ? "ltr" : "rtl";
  const targetFont = toSpanish ? "es-text" : "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-extrabold text-duo-gray">
          {toSpanish ? "תרגמו את המשפט לספרדית" : "תרגמו את המשפט לעברית"}
        </p>
        <h2
          className={`mt-2 text-3xl font-black leading-snug ${
            toSpanish ? "" : "es-text"
          }`}
          dir={toSpanish ? "rtl" : "ltr"}
        >
          {question.prompt}
        </h2>
      </div>

      {/* Answer line */}
      <div
        dir={targetDir}
        className="flex min-h-[64px] flex-wrap content-start items-start gap-2 border-b-2 border-t-2 border-duo-border py-3"
      >
        <AnimatePresence>
          {placed.map((chip) => (
            <motion.button
              key={chip.key}
              layoutId={chip.key}
              onClick={() => unplace(chip)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className={`rounded-xl border-2 border-b-4 border-duo-border bg-white px-3.5 py-2 text-lg font-bold transition-colors hover:bg-duo-bg ${targetFont}`}
              dir={targetDir}
            >
              {chip.text}
            </motion.button>
          ))}
        </AnimatePresence>
        {placed.length === 0 && (
          <span className="py-2 text-sm font-bold text-duo-gray">
            הקישו על המילים כדי לבנות את המשפט...
          </span>
        )}
      </div>

      {/* Word bank */}
      <div dir={targetDir} className="flex flex-wrap justify-center gap-2">
        {allChips.map((chip) =>
          placedKeys.has(chip.key) ? (
            // ghost slot for a used chip
            <span
              key={chip.key}
              className={`rounded-xl border-2 border-b-4 border-transparent bg-duo-border/60 px-3.5 py-2 text-lg font-bold text-transparent ${targetFont}`}
              dir={targetDir}
            >
              {chip.text}
            </span>
          ) : (
            <motion.button
              key={chip.key}
              layoutId={chip.key}
              onClick={() => place(chip)}
              whileHover={revealed ? undefined : { y: -2 }}
              whileTap={revealed ? undefined : { scale: 0.95 }}
              className={`rounded-xl border-2 border-b-4 border-duo-border bg-white px-3.5 py-2 text-lg font-bold transition-colors hover:bg-duo-bg ${
                revealed ? "opacity-50" : ""
              } ${targetFont}`}
              dir={targetDir}
              disabled={revealed}
            >
              {chip.text}
            </motion.button>
          )
        )}
      </div>

      {/* Correct answer shown after a miss */}
      {revealed && !wasCorrect && (
        <div className="rounded-2xl border-2 border-duo-red bg-duo-redLight px-4 py-3">
          <p className="text-sm font-extrabold text-duo-red">התשובה הנכונה:</p>
          <p
            className={`mt-1 text-lg font-black text-duo-text ${targetFont}`}
            dir={targetDir}
          >
            {question.answerTokens.join(" ")}
          </p>
        </div>
      )}

      {!revealed && (
        <DuoButton
          variant="green"
          size="lg"
          className="w-full"
          disabled={placed.length === 0}
          onClick={() =>
            onAnswer(checkSentenceAnswer(question, placed.map((c) => c.text)))
          }
        >
          בדיקה
        </DuoButton>
      )}
    </div>
  );
}
