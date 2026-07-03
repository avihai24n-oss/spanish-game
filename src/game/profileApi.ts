/**
 * Server-side profiles: username-only accounts stored on the Cloudflare
 * worker (see server/src/index.ts UserStore). The same name logs in from any
 * device and gets the same XP/games/wins/best-combo. localStorage remains an
 * offline cache — every call here degrades gracefully to null on failure.
 */

export interface ServerStats {
  totalXp: number;
  gamesPlayed: number;
  wins: number;
  bestCombo: number;
}

interface ServerUser {
  name: string;
  avatar: string;
  stats: ServerStats;
}

const HOST: string =
  (import.meta.env.VITE_REALTIME_HOST as string | undefined) ?? "localhost:8787";
const BASE = HOST.startsWith("localhost") ? `http://${HOST}` : `https://${HOST}`;

async function call(path: string, init?: RequestInit): Promise<ServerUser | null> {
  try {
    const res = await fetch(`${BASE}${path}`, init);
    if (!res.ok) return null;
    return (await res.json()) as ServerUser;
  } catch {
    return null; // offline / server unreachable — caller falls back to local
  }
}

/** Create-or-fetch the profile. seedStats migrates local stats on first login. */
export function loginUser(
  name: string,
  avatar: string,
  seedStats: ServerStats
): Promise<ServerUser | null> {
  return call("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, avatar, seedStats }),
  });
}

/** Report a finished round; returns the authoritative accumulated stats. */
export function reportRound(
  name: string,
  round: { xp: number; won: boolean; bestCombo: number }
): Promise<ServerUser | null> {
  return call("/api/round", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ...round }),
  });
}
