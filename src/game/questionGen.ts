import { words, sentences, distractorMap, wordById } from "../data";
import type {
  Direction,
  McqQuestion,
  Question,
  SentenceQuestion,
  WordEntry,
} from "./types";
import { createRng, shuffled, type Rng } from "./rng";

const MCQ_OPTIONS = 4;

/** Words eligible for MCQ (hardToQuiz entries are excluded). */
function mcqPool(): WordEntry[] {
  return words.filter((w) => !w.hardToQuiz);
}

/**
 * Pick 3 distractor words for a target word.
 * Prefers a curated distractor-map.json (id -> [ids]) when available,
 * falls back to random same-type entries, then to any random entries.
 */
function pickDistractors(target: WordEntry, rng: Rng): WordEntry[] {
  const chosen: WordEntry[] = [];
  const used = new Set<string>([target.id]);

  const curatedIds = distractorMap[target.id] ?? [];
  for (const id of shuffled(curatedIds, rng)) {
    if (chosen.length >= MCQ_OPTIONS - 1) break;
    const w = wordById.get(id);
    if (w && !used.has(w.id) && !w.hardToQuiz) {
      chosen.push(w);
      used.add(w.id);
    }
  }

  const pool = mcqPool();
  const sameType = shuffled(
    pool.filter((w) => w.type === target.type && !used.has(w.id)),
    rng
  );
  for (const w of sameType) {
    if (chosen.length >= MCQ_OPTIONS - 1) break;
    chosen.push(w);
    used.add(w.id);
  }

  if (chosen.length < MCQ_OPTIONS - 1) {
    const rest = shuffled(pool.filter((w) => !used.has(w.id)), rng);
    for (const w of rest) {
      if (chosen.length >= MCQ_OPTIONS - 1) break;
      chosen.push(w);
      used.add(w.id);
    }
  }

  return chosen;
}

function makeMcq(word: WordEntry, direction: Direction, rng: Rng): McqQuestion {
  const distractors = pickDistractors(word, rng);
  const side = direction === "he-to-es" ? "es" : "he";
  const optionWords = shuffled([word, ...distractors], rng);
  return {
    kind: "mcq",
    id: `mcq-${direction}-${word.id}`,
    direction,
    word,
    prompt: direction === "he-to-es" ? word.he : word.es,
    options: optionWords.map((w) => w[side]),
    correctIndex: optionWords.findIndex((w) => w.id === word.id),
  };
}

function makeSentence(
  sentence: (typeof sentences)[number],
  direction: Direction,
  rng: Rng
): SentenceQuestion {
  const toEs = direction === "he-to-es";
  const answerTokens = toEs ? sentence.esBank : sentence.heBank;
  const distractors = toEs ? sentence.esDistractors : sentence.heDistractors;
  return {
    kind: "sentence",
    id: `sen-${direction}-${sentence.id}`,
    direction,
    sentence,
    prompt: toEs ? sentence.he : sentence.es,
    answerTokens,
    bank: shuffled([...answerTokens, ...distractors], rng),
  };
}

/**
 * Deterministic 10-question round from a seed:
 * ~3 MCQ per direction + ~2 sentence-build per direction, order shuffled.
 * Two players sharing a seed get an identical round — this is how
 * multiplayer rounds stay in sync.
 */
export function generateRound(seed: string): Question[] {
  const rng = createRng(`round:${seed}`);

  const mcqWords = shuffled(mcqPool(), rng);
  const mcqHeEs = mcqWords.slice(0, 3);
  const mcqEsHe = mcqWords.slice(3, 6);

  const sentencePicks = shuffled(sentences, rng);
  const senHeEs = sentencePicks.slice(0, 2);
  const senEsHe = sentencePicks.slice(2, 4);

  const questions: Question[] = [
    ...mcqHeEs.map((w) => makeMcq(w, "he-to-es", rng)),
    ...mcqEsHe.map((w) => makeMcq(w, "es-to-he", rng)),
    ...senHeEs.map((s) => makeSentence(s, "he-to-es", rng)),
    ...senEsHe.map((s) => makeSentence(s, "es-to-he", rng)),
  ];

  return shuffled(questions, rng);
}

/** Normalize a sentence answer for comparison (ignore case + punctuation edges). */
function normalizeToken(t: string): string {
  return t.trim().toLowerCase().replace(/[.,!?¡¿]/g, "");
}

export function checkSentenceAnswer(
  question: SentenceQuestion,
  placed: string[]
): boolean {
  if (placed.length !== question.answerTokens.length) return false;
  return placed.every(
    (tok, i) => normalizeToken(tok) === normalizeToken(question.answerTokens[i])
  );
}
