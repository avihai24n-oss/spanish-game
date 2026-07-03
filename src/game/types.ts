// ---------- Data shapes (match the external dataset schema) ----------

export type Level = "easy" | "medium" | "hard" | "expert";

export const ALL_LEVELS: Level[] = ["easy", "medium", "hard", "expert"];

export const LEVEL_LABELS: Record<Level, string> = {
  easy: "קל",
  medium: "בינוני",
  hard: "קשה",
  expert: "מנוסים",
};

export function sanitizeLevels(input: unknown): Level[] {
  const valid = Array.isArray(input)
    ? ALL_LEVELS.filter((l) => input.includes(l))
    : [];
  return valid.length > 0 ? valid : [...ALL_LEVELS];
}

export interface WordEntry {
  id: string;
  es: string;
  he: string;
  en: string;
  type: string;
  level: Level;
  hardToQuiz?: boolean;
}

export interface SentenceEntry {
  id: string;
  es: string;
  he: string;
  esBank: string[];
  heBank: string[];
  esDistractors: string[];
  heDistractors: string[];
  level: Level;
}

/** Optional map: word id -> ids of good distractors */
export type DistractorMap = Record<string, string[]>;

// ---------- Question model ----------

export type Direction = "he-to-es" | "es-to-he";

export interface McqQuestion {
  kind: "mcq";
  id: string;
  direction: Direction;
  /** The word being tested */
  word: WordEntry;
  /** Prompt text (in the source language) */
  prompt: string;
  /** 4 options in target language, already shuffled */
  options: string[];
  /** Index of the correct option */
  correctIndex: number;
}

export interface SentenceQuestion {
  kind: "sentence";
  id: string;
  direction: Direction;
  sentence: SentenceEntry;
  /** Prompt sentence (source language) */
  prompt: string;
  /** Correct answer tokens, in order (target language) */
  answerTokens: string[];
  /** Word bank: answer tokens + distractors, shuffled */
  bank: string[];
}

export type Question = McqQuestion | SentenceQuestion;

// ---------- Round / match ----------

export const ROUND_SIZE = 10;
export const MCQ_TIME_MS = 10_000;
export const SENTENCE_TIME_MS = 25_000;
export const BASE_POINTS = 100;
export const MAX_TIME_BONUS = 50;
export const XP_PER_CORRECT = 10;

/** Sentence building takes real thinking time — it gets a longer clock. */
export function questionTimeMs(question: Pick<Question, "kind">): number {
  return question.kind === "sentence" ? SENTENCE_TIME_MS : MCQ_TIME_MS;
}

export interface AnswerRecord {
  questionIndex: number;
  correct: boolean;
  timeMs: number;
  points: number;
}

export interface PlayerState {
  name: string;
  avatar: string;
  score: number;
  /** questions completed (0..ROUND_SIZE) */
  progress: number;
  correctCount: number;
  finished: boolean;
}
