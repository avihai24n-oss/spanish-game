import type {
  MatchEvent,
  MatchEventHandler,
  MatchTransport,
} from "./MatchTransport";

/**
 * Placeholder for the real multiplayer backend (WebSocket / Supabase /
 * Firebase). The game already speaks only MatchTransport, so implementing
 * these methods is all that's needed to enable live matches.
 */
export class RealtimeTransport implements MatchTransport {
  async createRoom(): Promise<string> {
    throw new Error("RealtimeTransport not implemented yet");
  }

  async joinRoom(_id: string): Promise<void> {
    throw new Error("RealtimeTransport not implemented yet");
  }

  send(_event: MatchEvent): void {
    throw new Error("RealtimeTransport not implemented yet");
  }

  onEvent(_cb: MatchEventHandler): void {
    throw new Error("RealtimeTransport not implemented yet");
  }

  dispose(): void {
    // nothing to clean up
  }
}
