import type {
  MatchEvent,
  MatchEventHandler,
  MatchTransport,
} from "./MatchTransport";
import { pointsFor } from "../game/scoring";

const BOT_ACCURACY = 0.75;
const BOT_MIN_DELAY_MS = 2600;
const BOT_MAX_DELAY_MS = 8200;

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
      this.startBotRun(event.questionCount);
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

  private startBotRun(questionCount: number): void {
    let elapsed = 0;
    let totalScore = 0;
    let correctCount = 0;

    for (let i = 0; i < questionCount; i++) {
      const thinkMs =
        BOT_MIN_DELAY_MS +
        Math.random() * (BOT_MAX_DELAY_MS - BOT_MIN_DELAY_MS);
      const correct = Math.random() < BOT_ACCURACY;
      const points = pointsFor(correct, thinkMs);
      elapsed += thinkMs;
      totalScore += points;
      if (correct) correctCount++;

      const snapshotScore = totalScore;
      const snapshotCorrect = correctCount;
      const isLast = i === questionCount - 1;

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
