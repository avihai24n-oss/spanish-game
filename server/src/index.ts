import { Server, routePartykitRequest, type Connection, type WSMessage } from "partyserver";

type Env = {
  QuizRoom: DurableObjectNamespace;
  UserStore: DurableObjectNamespace;
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
const VALID_LEVELS = ["easy", "medium", "hard", "expert"];

export class QuizRoom extends Server<Env> {
  private players = new Map<string, PlayerInfo>();
  private started = false;
  private rematchVotes = new Set<string>();
  /** Difficulty selection adopted from the first player (the host). */
  private levels: string[] | null = null;

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
        const isFirstPlayer = this.players.size === 0;
        this.players.set(conn.id, {
          name: String(msg.name ?? "שחקן"),
          avatar: String(msg.avatar ?? "🙂"),
        });
        // The first player to introduce themselves sets the room difficulty.
        if (isFirstPlayer || this.levels === null) {
          const requested = Array.isArray(msg.levels)
            ? msg.levels.filter((l) => VALID_LEVELS.includes(String(l)))
            : [];
          this.levels = requested.length > 0 ? requested.map(String) : null;
        }
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
        // Tell the newcomer how many players are in — a lone player becomes
        // the "waiting host" in the UI instead of spinning forever.
        conn.send(
          JSON.stringify({ type: "roomState", players: this.players.size })
        );
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
    // Empty room forgets its difficulty — the next host sets it fresh.
    if (this.players.size === 0) this.levels = null;
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
    this.broadcast(
      JSON.stringify({
        type: "start",
        seed,
        levels: this.levels ?? VALID_LEVELS,
        t0: Date.now(),
      })
    );
  }

  private relay(from: Connection, msg: Record<string, unknown>): void {
    for (const c of this.getConnections()) {
      if (c.id !== from.id) c.send(JSON.stringify(msg));
    }
  }
}

// ---------------- User profiles (username-only accounts) ----------------

interface UserStats {
  totalXp: number;
  gamesPlayed: number;
  wins: number;
  bestCombo: number;
}

interface UserRecord {
  /** Display name (as typed on first login) */
  name: string;
  avatar: string;
  stats: UserStats;
  updatedAt: number;
}

const ZERO_STATS: UserStats = { totalXp: 0, gamesPlayed: 0, wins: 0, bestCombo: 0 };

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function userKey(name: unknown): string | null {
  const key = String(name ?? "").trim().toLowerCase();
  return key.length >= 2 && key.length <= 32 ? `user:${key}` : null;
}

function sanitizeStats(input: unknown): UserStats {
  const s = (input ?? {}) as Partial<Record<keyof UserStats, unknown>>;
  const num = (v: unknown) =>
    Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0;
  return {
    totalXp: num(s.totalXp),
    gamesPlayed: num(s.gamesPlayed),
    wins: num(s.wins),
    bestCombo: num(s.bestCombo),
  };
}

/**
 * All user profiles live in one Durable Object ("global") with persistent
 * storage. Login is by username only — no passwords, by design: this is a
 * friends-and-family game.
 */
export class UserStore {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    let body: Record<string, unknown> = {};
    if (request.method === "POST") {
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ error: "bad json" }, 400);
      }
    }

    // GET /api/user?name=X — fetch a profile
    if (request.method === "GET" && url.pathname === "/api/user") {
      const key = userKey(url.searchParams.get("name"));
      if (!key) return json({ error: "bad name" }, 400);
      const record = await this.state.storage.get<UserRecord>(key);
      return record ? json(record) : json({ error: "not found" }, 404);
    }

    // POST /api/login {name, avatar, seedStats?} — create or refresh a profile.
    // seedStats migrates pre-existing localStorage stats on first login only.
    if (request.method === "POST" && url.pathname === "/api/login") {
      const key = userKey(body.name);
      if (!key) return json({ error: "bad name" }, 400);
      const existing = await this.state.storage.get<UserRecord>(key);
      const record: UserRecord = existing
        ? {
            ...existing,
            avatar: String(body.avatar ?? existing.avatar),
            updatedAt: Date.now(),
          }
        : {
            name: String(body.name).trim(),
            avatar: String(body.avatar ?? "🙂"),
            stats: sanitizeStats(body.seedStats ?? ZERO_STATS),
            updatedAt: Date.now(),
          };
      await this.state.storage.put(key, record);
      return json(record);
    }

    // POST /api/round {name, xp, won, bestCombo} — accumulate a finished round
    if (request.method === "POST" && url.pathname === "/api/round") {
      const key = userKey(body.name);
      if (!key) return json({ error: "bad name" }, 400);
      const existing = await this.state.storage.get<UserRecord>(key);
      if (!existing) return json({ error: "not found" }, 404);
      const xp = sanitizeStats({ totalXp: body.xp }).totalXp;
      const record: UserRecord = {
        ...existing,
        stats: {
          totalXp: existing.stats.totalXp + xp,
          gamesPlayed: existing.stats.gamesPlayed + 1,
          wins: existing.stats.wins + (body.won ? 1 : 0),
          bestCombo: Math.max(
            existing.stats.bestCombo,
            sanitizeStats({ bestCombo: body.bestCombo }).bestCombo
          ),
        },
        updatedAt: Date.now(),
      };
      await this.state.storage.put(key, record);
      return json(record);
    }

    return json({ error: "not found" }, 404);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Profile API — routed to the single global UserStore object
    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }
      const stub = env.UserStore.get(env.UserStore.idFromName("global"));
      return stub.fetch(request);
    }

    const routed = await routePartykitRequest(
      request,
      env as unknown as Record<string, unknown>
    );
    return routed ?? new Response("¡Vamos! quiz server", { status: 200 });
  },
};
