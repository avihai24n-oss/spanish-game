import { BASE_POINTS, MAX_TIME_BONUS, QUESTION_TIME_MS } from "./types";

/**
 * Race scoring: 100 points per correct answer plus a speed bonus of up to
 * +50 that decays linearly to 0 over the 10-second question window.
 */
export function pointsFor(correct: boolean, timeMs: number): number {
  if (!correct) return 0;
  const remaining = Math.max(0, QUESTION_TIME_MS - timeMs);
  const bonus = Math.round((remaining / QUESTION_TIME_MS) * MAX_TIME_BONUS);
  return BASE_POINTS + bonus;
}

export function accuracy(correctCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correctCount / total) * 100);
}
