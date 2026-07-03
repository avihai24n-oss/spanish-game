import { Server, routePartykitRequest, type Connection, type WSMessage } from "partyserver";

type Env = {
  QuizRoom: DurableObjectNamespace;
};

interface PlayerInfo {
  name: string;
  avatar: string;
}

/**
 * One Durable Object per room code. Both players connect over WebSocket;
 * when two players have said hello the room broadcasts `start` with a shared
 * seed (both clients generate the identical question round from it) and then
 * simply relays answer/finish events between the two.
 */
export class QuizRoom extends Server<Env> {
  private players = new Map<string, PlayerInfo>();
  private started = false;
  private rematchVotes = new Set<string>();

  onConnect(conn: Connection): void {
    const conns = [...this.getConnections()];
    if (conns.length > 2) {
      conn.send(JSON.stringify({ type: "roomFull" }));
      conn.close(4000, "room full");
    }
  }

  onMessage(conn: Connection, raw: WSMessage): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    switch (msg.type) {
      case "hello": {
        this.players.set(conn.id, {
          name: String(msg.name ?? "שחקן"),
          avatar: String(msg.avatar ?? "🙂"),
        });
        // Introduce both sides to each other
        for (const other of this.getConnections()) {
          if (other.id === conn.id) continue;
          const otherInfo = this.players.get(other.id);
          if (otherInfo) {
            conn.send(JSON.stringify({ type: "opponentJoined", ...otherInfo }));
          }
          other.send(
            JSON.stringify({
              type: "opponentJoined",
              ...this.players.get(conn.id),
            })
          );
        }
        this.maybeStart();
        break;
      }

      case "answer":
      case "finished":
        this.relay(conn, msg);
        break;

      case "rematch": {
        this.rematchVotes.add(conn.id);
        this.relay(conn, { type: "opponentWantsRematch" });
        const connected = [...this.getConnections()].map((c) => c.id);
        if (connected.every((id) => this.rematchVotes.has(id)) && connected.length === 2) {
          this.rematchVotes.clear();
          this.started = false;
          this.maybeStart();
        }
        break;
      }
    }
  }

  onClose(conn: Connection): void {
    this.players.delete(conn.id);
    this.rematchVotes.delete(conn.id);
    if ([...this.getConnections()].length < 2) this.started = false;
    this.broadcast(JSON.stringify({ type: "opponentLeft" }));
  }

  onError(conn: Connection, _error: unknown): void {
    this.onClose(conn);
  }

  private maybeStart(): void {
    if (this.started) return;
    const conns = [...this.getConnections()];
    if (conns.length !== 2) return;
    // wait until both players introduced themselves
    if (!conns.every((c) => this.players.has(c.id))) return;

    this.started = true;
    const seed = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
    this.broadcast(JSON.stringify({ type: "start", seed, t0: Date.now() }));
  }

  private relay(from: Connection, msg: Record<string, unknown>): void {
    for (const c of this.getConnections()) {
      if (c.id !== from.id) c.send(JSON.stringify(msg));
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const routed = await routePartykitRequest(
      request,
      env as unknown as Record<string, unknown>
    );
    return routed ?? new Response("¡Vamos! quiz server", { status: 200 });
  },
};
