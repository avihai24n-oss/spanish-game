import { BASE_POINTS, MAX_TIME_BONUS, MCQ_TIME_MS } from "./types";

/**
 * Race scoring: 100 points per correct answer plus a speed bonus of up to
 * +50 that decays linearly to 0 over the question's time window.
 */
export function pointsFor(
  correct: boolean,
  timeMs: number,
  timeLimitMs: number = MCQ_TIME_MS
): number {
  if (!correct) return 0;
  const remaining = Math.max(0, timeLimitMs - timeMs);
  const bonus = Math.round((remaining / timeLimitMs) * MAX_TIME_BONUS);
  return BASE_POINTS + bonus;
}

export function accuracy(correctCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correctCount / total) * 100);
}
