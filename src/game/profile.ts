/**
 * Lightweight username-only "accounts": a profile is just a name + avatar in
 * localStorage, and stats are stored per profile name so friends sharing a
 * device each keep their own record. No passwords — this is for friends.
 */

export interface Profile {
  name: string;
  avatar: string;
}

const PROFILE_KEY = "vamos-profile-v1";

export const AVATAR_CHOICES = ["🦸", "🧑‍🚀", "🐯", "🦜", "🌮", "⚡", "🔥", "🎯"] as const;

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    if (!parsed.name || typeof parsed.name !== "string") return null;
    return { name: parsed.name, avatar: parsed.avatar || AVATAR_CHOICES[0] };
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // storage unavailable — profile lives only for the session
  }
}

/** Stats key namespaced by username (trimmed, case-insensitive). */
export function statsKeyFor(name: string): string {
  return `vamos-stats-v1:${name.trim().toLowerCase()}`;
}
