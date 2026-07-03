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

/**
 * Simulated opponent: answers the same round with a randomized, realistic
 * delay per question and ~75% accuracy. Exercises the full race UI through
 * the exact same MatchTransport events a real opponent would produce.
 */
export class BotTransport implements MatchTransport {
  private handlers: MatchEventHandler[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];

  async createRoom(): Promise<string> {
    return "bot-room";
  }

  async joinRoom(_id: string): Promise<void> {
    // The bot is always ready.
  }

  send(event: MatchEvent): void {
    if (event.type === "roundStart") {
      this.startBotRun(event.questionKinds);
    }
    // playerAnswer / playerFinished would be relayed to a real opponent;
    // the bot doesn't react to them.
  }

  onEvent(cb: MatchEventHandler): void {
    this.handlers.push(cb);
  }

  dispose(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.handlers = [];
  }

  private emit(event: MatchEvent): void {
    this.handlers.forEach((h) => h(event));
  }

  private startBotRun(questionKinds: Array<"mcq" | "sentence">): void {
    let elapsed = 0;
    let totalScore = 0;
    let correctCount = 0;

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

      const snapshotScore = totalScore;
      const snapshotCorrect = correctCount;
      const isLast = i === questionKinds.length - 1;

      this.timers.push(
        setTimeout(() => {
          this.emit({
            type: "opponentAnswer",
            questionIndex: i,
            correct,
            points,
            totalScore: snapshotScore,
            progress: i + 1,
          });
          if (isLast) {
            this.emit({
              type: "opponentFinished",
              totalScore: snapshotScore,
              correctCount: snapshotCorrect,
            });
          }
        }, elapsed)
      );
    }
  }
}
