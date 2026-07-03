import { words, sentences, distractorMap, wordById } from "../data";
import type {
  Direction,
  Level,
  McqQuestion,
  Question,
  SentenceEntry,
  SentenceQuestion,
  WordEntry,
} from "./types";
import { ALL_LEVELS, sanitizeLevels } from "./types";
import { createRng, shuffled, type Rng } from "./rng";

const MCQ_OPTIONS = 4;

/** Words eligible for MCQ (hardToQuiz entries are excluded). */
function mcqPool(levels: Level[]): WordEntry[] {
  const pool = words.filter(
    (w) => !w.hardToQuiz && levels.includes(w.level)
  );
  // Safety net: a broken/empty selection must never produce an empty round.
  return pool.length >= MCQ_OPTIONS
    ? pool
    : words.filter((w) => !w.hardToQuiz);
}

function sentencePool(levels: Level[]): SentenceEntry[] {
  const pool = sentences.filter((s) => levels.includes(s.level));
  return pool.length >= 4 ? pool : sentences;
}

/**
 * Pick 3 distractor words for a target word.
 * Prefers a curated distractor-map.json (id -> [ids]) when available,
 * falls back to random same-type entries from the same level pool,
 * then to any random entries.
 */
function pickDistractors(
  target: WordEntry,
  pool: WordEntry[],
  rng: Rng
): WordEntry[] {
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
    const rest = shuffled(
      words.filter((w) => !w.hardToQuiz && !used.has(w.id)),
      rng
    );
    for (const w of rest) {
      if (chosen.length >= MCQ_OPTIONS - 1) break;
      chosen.push(w);
      used.add(w.id);
    }
  }

  return chosen;
}

function makeMcq(
  word: WordEntry,
  direction: Direction,
  pool: WordEntry[],
  rng: Rng
): McqQuestion {
  const distractors = pickDistractors(word, pool, rng);
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
  sentence: SentenceEntry,
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
 * Two players sharing a seed AND the same level selection get an identical
 * round — this is how multiplayer rounds stay in sync (levels travel with
 * the matchStart event).
 */
export function generateRound(
  seed: string,
  levels: Level[] = ALL_LEVELS
): Question[] {
  const safeLevels = sanitizeLevels(levels);
  // Levels are part of the deterministic input: same seed + same levels
  // must yield the same round on both clients.
  const rng = createRng(`round:${safeLevels.join(",")}:${seed}`);

  const pool = mcqPool(safeLevels);
  const mcqWords = shuffled(pool, rng);
  const mcqHeEs = mcqWords.slice(0, 3);
  const mcqEsHe = mcqWords.slice(3, 6);

  const sentencePicks = shuffled(sentencePool(safeLevels), rng);
  const senHeEs = sentencePicks.slice(0, 2);
  const senEsHe = sentencePicks.slice(2, 4);

  const questions: Question[] = [
    ...mcqHeEs.map((w) => makeMcq(w, "he-to-es", pool, rng)),
    ...mcqEsHe.map((w) => makeMcq(w, "es-to-he", pool, rng)),
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
