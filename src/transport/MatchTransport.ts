/**
 * Transport abstraction for competitive matches.
 *
 * ALL game-to-opponent communication goes through this interface, so the
 * current BotTransport can later be swapped for a real realtime backend
 * (WebSocket / Firebase / Supabase Realtime) without touching game logic.
 */

export type MatchEvent =
  /** Sent by the local player when a round begins (seed syncs the questions). */
  | {
      type: "roundStart";
      seed: string;
      questionCount: number;
      /** Question kinds in round order — lets an opponent (or bot) pace itself. */
      questionKinds: Array<"mcq" | "sentence">;
    }
  /** Sent by the local player after answering a question. */
  | {
      type: "playerAnswer";
      questionIndex: number;
      correct: boolean;
      points: number;
      totalScore: number;
    }
  /** Sent by the local player when they finish the round. */
  | { type: "playerFinished"; totalScore: number; correctCount: number }
  /** Sent by the local player asking for another round. */
  | { type: "rematchRequest" }
  /** Received: the opponent answered a question. */
  | {
      type: "opponentAnswer";
      questionIndex: number;
      correct: boolean;
      points: number;
      totalScore: number;
      progress: number;
    }
  /** Received: the opponent finished the round. */
  | { type: "opponentFinished"; totalScore: number; correctCount: number }
  /** Received: an opponent connected to the room and introduced themselves. */
  | { type: "opponentJoined"; name: string; avatar: string }
  /** Received on join: how many players (including you) are in the room. */
  | { type: "roomState"; players: number }
  /** Received: both players are in — the round starts with this shared seed. */
  | { type: "matchStart"; seed: string }
  /** Received: the opponent wants a rematch. */
  | { type: "opponentWantsRematch" }
  /** Received: the opponent disconnected. */
  | { type: "opponentLeft" }
  /** Received: the room already has two players. */
  | { type: "roomFull" };

export type MatchEventHandler = (event: MatchEvent) => void;

export interface MatchTransport {
  /** Create a room and return its shareable id. */
  createRoom(): Promise<string>;
  /** Join an existing room by id. */
  joinRoom(id: string): Promise<void>;
  /** Send an event to the opponent. */
  send(event: MatchEvent): void;
  /** Subscribe to opponent events. */
  onEvent(cb: MatchEventHandler): void;
  /** Tear down timers / connections. */
  dispose(): void;
}
