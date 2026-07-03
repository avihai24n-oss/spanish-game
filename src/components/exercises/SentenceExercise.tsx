import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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

interface SpeechAlternativeLike {
  transcript: string;
  confidence?: number;
}

interface SpeechResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlternativeLike;
}

interface SpeechResultListLike {
  length: number;
  [index: number]: SpeechResultLike;
}

interface SpeechResultEventLike {
  resultIndex?: number;
  results: SpeechResultListLike;
}

interface SpeechErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: ((event: SpeechErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechStatus = "idle" | "listening" | "matched" | "low" | "missing" | "unsupported" | "error";

const MIN_SPEECH_CONFIDENCE = 0.86;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function normalizeSpokenWord(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[\s"'“”‘’.,!?¿¡:;()[\]{}־-]+|[\s"'“”‘’.,!?¿¡:;()[\]{}־-]+$/g, "")
    .replace(/[\u0591-\u05c7]/g, "");
}

function spokenWords(transcript: string): string[] {
  return transcript
    .split(/\s+/)
    .map(normalizeSpokenWord)
    .filter(Boolean);
}

function speechConfidence(
  alternative: SpeechAlternativeLike,
  result: SpeechResultLike
): number {
  if (typeof alternative.confidence === "number") {
    // Chrome often reports 0 for interim hypotheses even when the text is already
    // stable enough for an exact word-bank match. Treat that as usable only while
    // the result is still interim; final low-confidence results stay blocked.
    if (!result.isFinal && alternative.confidence === 0) return MIN_SPEECH_CONFIDENCE;
    return alternative.confidence;
  }
  return result.isFinal ? 1 : MIN_SPEECH_CONFIDENCE;
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
  const [listening, setListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>("idle");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const manualStopRef = useRef(false);
  const placedRef = useRef<Chip[]>([]);

  const allChips: Chip[] = useMemo(
    () =>
      question.bank.map((text, i) => ({
        key: `${i}-${text}`,
        text,
      })),
    [question.bank]
  );
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
  const speechLang = toSpanish ? "es-ES" : "he-IL";
  const speechSupported = getSpeechRecognitionConstructor() !== null;

  useEffect(() => {
    placedRef.current = placed;
  }, [placed]);

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, [question.id]);

  useEffect(() => {
    if (!revealed) return;
    manualStopRef.current = true;
    recognitionRef.current?.abort();
    setListening(false);
  }, [revealed]);

  const attachSpokenWords = (transcript: string) => {
    const words = spokenWords(transcript);
    if (words.length === 0) return 0;

    const usedKeys = new Set(placedRef.current.map((chip) => chip.key));
    const chipsToPlace: Chip[] = [];

    for (const word of words) {
      const chip = allChips.find(
        (candidate) =>
          !usedKeys.has(candidate.key) &&
          normalizeSpokenWord(candidate.text) === word
      );
      if (!chip) continue;
      usedKeys.add(chip.key);
      chipsToPlace.push(chip);
    }

    if (chipsToPlace.length === 0) return 0;
    const nextPlaced = [...placedRef.current, ...chipsToPlace];
    placedRef.current = nextPlaced;
    setPlaced(nextPlaced);
    return chipsToPlace.length;
  };

  const handleSpeechResult = (event: SpeechResultEventLike) => {
    let matched = 0;
    let heardHighConfidenceMiss = false;
    let heardLowConfidence = false;

    const start = event.resultIndex ?? Math.max(0, event.results.length - 1);
    for (let resultIndex = start; resultIndex < event.results.length; resultIndex += 1) {
      const result = event.results[resultIndex];
      if (!result) continue;

      for (let altIndex = 0; altIndex < result.length; altIndex += 1) {
        const alternative = result[altIndex];
        const confidence = speechConfidence(alternative, result);

        if (confidence < MIN_SPEECH_CONFIDENCE) {
          heardLowConfidence = true;
          continue;
        }

        const added = attachSpokenWords(alternative.transcript);
        if (added > 0) {
          matched += added;
          break;
        }
        heardHighConfidenceMiss = true;
      }
    }

    if (matched > 0) {
      setSpeechStatus("matched");
    } else if (heardHighConfidenceMiss) {
      setSpeechStatus("missing");
    } else if (heardLowConfidence) {
      setSpeechStatus("low");
    }
  };

  const stopListening = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    setListening(false);
    setSpeechStatus("idle");
  };

  const startListening = () => {
    if (revealed) return;
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setSpeechStatus("unsupported");
      return;
    }

    manualStopRef.current = false;
    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = speechLang;
    recognition.onresult = handleSpeechResult;
    recognition.onerror = () => {
      setListening(false);
      setSpeechStatus("error");
    };
    recognition.onend = () => {
      setListening(false);
      if (!manualStopRef.current) {
        setSpeechStatus("idle");
      }
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
      setSpeechStatus("listening");
    } catch {
      setListening(false);
      setSpeechStatus("error");
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <section className="panel rounded-[1.4rem] p-4 sm:rounded-[1.7rem] sm:p-7">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.14em] text-duo-purple">
          {toSpanish ? "תרגמו את המשפט לספרדית" : "תרגמו את המשפט לעברית"}
        </p>
        <h2
          className={`mt-2 text-2xl font-black leading-snug text-duo-ink sm:mt-3 sm:text-3xl ${
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
        className="mt-4 flex min-h-[60px] flex-wrap content-start items-start gap-2 rounded-2xl border border-dashed border-duo-borderStrong bg-white/60 p-2.5 sm:mt-5 sm:min-h-[76px] sm:p-3"
      >
        {placed.map((chip) => (
          <motion.button
            key={chip.key}
            layoutId={`${question.id}:${chip.key}`}
            onClick={() => unplace(chip)}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl border border-b-4 border-duo-border bg-white px-3 py-1.5 text-base font-bold shadow-card transition-colors hover:bg-duo-surface2 sm:px-3.5 sm:py-2 sm:text-lg ${targetFont}`}
            dir={targetDir}
          >
            {chip.text}
          </motion.button>
        ))}
        {placed.length === 0 && (
          <span className="py-2 text-sm font-bold text-duo-gray">
            הקישו על המילים כדי לבנות את המשפט...
          </span>
        )}
      </div>

      {!revealed && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={toggleListening}
            disabled={!speechSupported}
            aria-label={listening ? "כיבוי מיקרופון" : "הפעלת מיקרופון"}
            className={`relative flex h-[52px] w-[52px] items-center justify-center rounded-full border border-b-4 text-2xl font-black shadow-card transition-all active:translate-y-[3px] active:border-b ${
              listening
                ? "border-duo-redShadow bg-duo-red text-white"
                : speechStatus === "matched"
                  ? "border-duo-greenShadow bg-duo-green text-white"
                  : "border-duo-purpleShadow bg-duo-purple text-white"
            } disabled:cursor-not-allowed disabled:border-duo-border disabled:bg-duo-border disabled:text-duo-gray`}
          >
            {listening && (
              <span className="absolute inset-[-5px] rounded-full border-2 border-duo-red/35 animate-ping" />
            )}
            <span aria-hidden="true">🎙</span>
          </button>
        </div>
      )}

      {/* Word bank */}
      <div dir={targetDir} className="mt-4 flex flex-wrap justify-center gap-2 sm:mt-5">
        {allChips.map((chip) =>
          placedKeys.has(chip.key) ? (
            // ghost slot for a used chip
            <span
              key={chip.key}
              className={`rounded-xl border border-b-4 border-transparent bg-duo-border/60 px-3 py-1.5 text-base font-bold text-transparent sm:px-3.5 sm:py-2 sm:text-lg ${targetFont}`}
              dir={targetDir}
            >
              {chip.text}
            </span>
          ) : (
            <motion.button
              key={chip.key}
              layoutId={`${question.id}:${chip.key}`}
              onClick={() => place(chip)}
              whileHover={revealed ? undefined : { y: -2 }}
              whileTap={revealed ? undefined : { scale: 0.95 }}
              className={`rounded-xl border border-b-4 border-duo-border bg-white/85 px-3 py-1.5 text-base font-bold shadow-card transition-colors hover:bg-duo-surface2 sm:px-3.5 sm:py-2 sm:text-lg ${
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
        <div className="mt-5 rounded-2xl border border-duo-red/45 bg-duo-redLight px-4 py-3">
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
          className="mt-4 w-full sm:mt-5"
          disabled={placed.length === 0}
          onClick={() =>
            onAnswer(checkSentenceAnswer(question, placed.map((c) => c.text)))
          }
        >
          בדיקה
        </DuoButton>
      )}
    </section>
  );
}
