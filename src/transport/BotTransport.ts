import type {
  MatchEvent,
  MatchEventHandler,
  MatchTransport,
} from "./MatchTransport";
import { pointsFor } from "../game/scoring";
import { MCQ_TIME_MS, SENTENCE_TIME_MS } from "../game/types";

const BOT_ACCURACY = 0.75;
/** Per-question think-time ranges, matching each kind's clock. */
const BOT_DELAY_RANGES = {
  mcq: { min: 2600, max: 8200 },
  sentence: { min: 8000, max: 20000 },
} as const;

interface PlannedBotAnswer {
  questionIndex: number;
  correct: boolean;
  points: number;
  totalScore: number;
  progress: number;
  correctCount: number;
  isLast: boolean;
  delayMs: number;
}

/**
 * Simulated opponent: answers the same round with a randomized, realistic
 * delay per question and ~75% accuracy. Exercises the full race UI through
 * the exact same MatchTransport events a real opponent would produce.
 */
export class BotTransport implements MatchTransport {
  private handlers: MatchEventHandler[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private plan: PlannedBotAnswer[] = [];
  private nextAnswerIndex = 0;
  private finished = false;

  async createRoom(): Promise<string> {
    return "bot-room";
  }

  async joinRoom(_id: string): Promise<void> {
    // The bot is always ready.
  }

  send(event: MatchEvent): void {
    if (event.type === "roundStart") {
      this.startBotRun(event.questionKinds);
    } else if (event.type === "playerFinished") {
      this.fastForwardRemainingAnswers();
    }
    // playerAnswer would be relayed to a real opponent; the bot only reacts to
    // playerFinished so waiting after a fast player stays short in bot mode.
  }

  onEvent(cb: MatchEventHandler): void {
    this.handlers.push(cb);
  }

  dispose(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.handlers = [];
    this.plan = [];
    this.nextAnswerIndex = 0;
    this.finished = false;
  }

  private emit(event: MatchEvent): void {
    this.handlers.forEach((h) => h(event));
  }

  private startBotRun(questionKinds: Array<"mcq" | "sentence">): void {
    let elapsed = 0;
    let totalScore = 0;
    let correctCount = 0;
    this.plan = [];
    this.nextAnswerIndex = 0;
    this.finished = false;
    this.timers.forEach(clearTimeout);
    this.timers = [];

    for (let i = 0; i < questionKinds.length; i++) {
      const kind = questionKinds[i];
      const range = BOT_DELAY_RANGES[kind];
      const thinkMs = range.min + Math.random() * (range.max - range.min);
      const timeLimit = kind === "sentence" ? SENTENCE_TIME_MS : MCQ_TIME_MS;
      const correct = Math.random() < BOT_ACCURACY;
      const points = pointsFor(correct, thinkMs, timeLimit);
      elapsed += thinkMs;
      totalScore += points;
      if (correct) correctCount++;
      this.plan.push({
        questionIndex: i,
        correct,
        points,
        totalScore,
        progress: i + 1,
        correctCount,
        isLast: i === questionKinds.length - 1,
        delayMs: elapsed,
      });
    }

    for (let i = 0; i < this.plan.length; i++) {
      const answer = this.plan[i];
      this.timers.push(
        setTimeout(() => {
          this.emitAnswer(i);
        }, answer.delayMs)
      );
    }
  }

  private emitAnswer(index: number): void {
    if (this.finished || index < this.nextAnswerIndex) return;
    const answer = this.plan[index];
    if (!answer) return;

    this.nextAnswerIndex = index + 1;
    this.emit({
      type: "opponentAnswer",
      questionIndex: answer.questionIndex,
      correct: answer.correct,
      points: answer.points,
      totalScore: answer.totalScore,
      progress: answer.progress,
    });

    if (answer.isLast) {
      this.finished = true;
      this.emit({
        type: "opponentFinished",
        totalScore: answer.totalScore,
        correctCount: answer.correctCount,
      });
    }
  }

  private fastForwardRemainingAnswers(): void {
    if (this.finished || this.nextAnswerIndex >= this.plan.length) return;
    this.timers.forEach(clearTimeout);
    this.timers = [];

    for (let i = this.nextAnswerIndex; i < this.plan.length; i++) {
      const delay = 450 * (i - this.nextAnswerIndex + 1);
      this.timers.push(
        setTimeout(() => {
          this.emitAnswer(i);
        }, delay)
      );
    }
  }
}
