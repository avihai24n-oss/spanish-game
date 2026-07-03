import PartySocket from "partysocket";
import type {
  MatchEvent,
  MatchEventHandler,
  MatchTransport,
} from "./MatchTransport";
import type { Profile } from "../game/profile";
import type { Level } from "../game/types";
import { sanitizeLevels } from "../game/types";

/**
 * Live 1v1 transport over a Cloudflare Durable Object room (partyserver).
 * The room relays events between exactly two players and broadcasts
 * `start {seed}` once both are in — see server/src/index.ts.
 */

const HOST: string =
  (import.meta.env.VITE_REALTIME_HOST as string | undefined) ?? "localhost:8787";

/** Unambiguous room-code alphabet (no O/0, I/1...). */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomRoomCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export class RealtimeTransport implements MatchTransport {
  private socket: PartySocket | null = null;
  private handlers: MatchEventHandler[] = [];
  private profile: Profile;
  private levels: Level[];
  private disposed = false;

  constructor(profile: Profile, levels: Level[]) {
    this.profile = profile;
    this.levels = levels;
  }

  async createRoom(): Promise<string> {
    // Rooms are lazy: the Durable Object comes to life on first connect,
    // so a fresh random code IS the room.
    return randomRoomCode();
  }

  async joinRoom(id: string): Promise<void> {
    const socket = new PartySocket({
      host: HOST,
      party: "quiz-room",
      room: id.toUpperCase(),
    });
    this.socket = socket;

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "hello",
          name: this.profile.name,
          avatar: this.profile.avatar,
          // The server adopts the FIRST player's selection as the room's
          // difficulty and echoes it back in `start` to both clients.
          levels: this.levels,
        })
      );
    });

    socket.addEventListener("message", (e) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(e.data));
      } catch {
        return;
      }
      const event = this.toMatchEvent(msg);
      if (event) this.emit(event);
    });

    socket.addEventListener("close", (e) => {
      // 4000 = room full (server-initiated); other closes trigger
      // partysocket's auto-reconnect, no event needed.
      if (e.code === 4000) this.emit({ type: "roomFull" });
    });
  }

  send(event: MatchEvent): void {
    if (!this.socket) return;
    switch (event.type) {
      case "playerAnswer":
        this.socket.send(
          JSON.stringify({
            type: "answer",
            questionIndex: event.questionIndex,
            correct: event.correct,
            points: event.points,
            totalScore: event.totalScore,
          })
        );
        break;
      case "playerFinished":
        this.socket.send(
          JSON.stringify({
            type: "finished",
            totalScore: event.totalScore,
            correctCount: event.correctCount,
          })
        );
        break;
      case "rematchRequest":
        this.socket.send(JSON.stringify({ type: "rematch" }));
        break;
      case "roundStart":
        // The server decides when a duel starts — nothing to send.
        break;
    }
  }

  onEvent(cb: MatchEventHandler): void {
    this.handlers.push(cb);
  }

  dispose(): void {
    this.disposed = true;
    this.handlers = [];
    this.socket?.close();
    this.socket = null;
  }

  private emit(event: MatchEvent): void {
    if (this.disposed) return;
    this.handlers.forEach((h) => h(event));
  }

  /** Server wire messages -> typed MatchEvents. */
  private toMatchEvent(msg: Record<string, unknown>): MatchEvent | null {
    switch (msg.type) {
      case "opponentJoined":
        return {
          type: "opponentJoined",
          name: String(msg.name ?? "יריב"),
          avatar: String(msg.avatar ?? "🙂"),
        };
      case "roomState":
        return { type: "roomState", players: Number(msg.players ?? 1) };
      case "start":
        // Older servers don't send levels; sanitizeLevels falls back to ALL
        // levels — identical on both clients, so rounds still stay in sync.
        return {
          type: "matchStart",
          seed: String(msg.seed),
          levels: sanitizeLevels(msg.levels),
        };
      case "answer": {
        const questionIndex = Number(msg.questionIndex ?? 0);
        return {
          type: "opponentAnswer",
          questionIndex,
          correct: Boolean(msg.correct),
          points: Number(msg.points ?? 0),
          totalScore: Number(msg.totalScore ?? 0),
          progress: questionIndex + 1,
        };
      }
      case "finished":
        return {
          type: "opponentFinished",
          totalScore: Number(msg.totalScore ?? 0),
          correctCount: Number(msg.correctCount ?? 0),
        };
      case "opponentWantsRematch":
        return { type: "opponentWantsRematch" };
      case "opponentLeft":
        return { type: "opponentLeft" };
      case "roomFull":
        return { type: "roomFull" };
      default:
        return null;
    }
  }
}
