import { create } from "zustand";
import type { AnswerRecord, Level, PlayerState, Question } from "./types";
import {
  ROUND_SIZE,
  XP_PER_CORRECT,
  questionTimeMs,
  sanitizeLevels,
} from "./types";
import { generateRound } from "./questionGen";
import { pointsFor } from "./scoring";
import { randomSeed } from "./rng";
import type { MatchTransport } from "../transport/MatchTransport";
import { BotTransport } from "../transport/BotTransport";
import { RealtimeTransport } from "../transport/RealtimeTransport";
import { loadProfile, saveProfile, statsKeyFor, type Profile } from "./profile";
import { loginUser, reportRound } from "./profileApi";

export type Screen =
  | "profile"
  | "home"
  | "lobby"
  | "game"
  | "waiting"
  | "results"
  | "flashcards";
export type Phase = "answering" | "feedback";
export type Mode = "bot" | "duel";
export type LobbyStatus =
  | "creating"
  | "waiting"
  | "joining"
  | "ready"
  | "starting"
  | "full"
  | "error";

const LEGACY_STATS_KEY = "vamos-stats-v1";
const LEVELS_KEY = "vamos-levels-v1";

function loadLevels(): Level[] {
  try {
    const raw = localStorage.getItem(LEVELS_KEY);
    if (raw) return sanitizeLevels(JSON.parse(raw));
  } catch {
    // ignore corrupt storage
  }
  return sanitizeLevels(["medium"]);
}

function saveLevels(levels: Level[]): void {
  try {
    localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
  } catch {
    // storage unavailable — selection is best-effort
  }
}

interface PersistentStats {
  totalXp: number;
  gamesPlayed: number;
  wins: number;
  bestCombo: number;
}

const defaultStats: PersistentStats = {
  totalXp: 0,
  gamesPlayed: 0,
  wins: 0,
  bestCombo: 0,
};

function loadStats(profileName: string | null): PersistentStats {
  try {
    const key = profileName ? statsKeyFor(profileName) : LEGACY_STATS_KEY;
    const raw =
      localStorage.getItem(key) ?? localStorage.getItem(LEGACY_STATS_KEY);
    if (raw) return { ...defaultStats, ...JSON.parse(raw) };
  } catch {
    // ignore corrupt storage
  }
  return { ...defaultStats };
}

function saveStats(profileName: string | null, stats: PersistentStats): void {
  try {
    const key = profileName ? statsKeyFor(profileName) : LEGACY_STATS_KEY;
    localStorage.setItem(key, JSON.stringify(stats));
  } catch {
    // storage unavailable — stats are best-effort
  }
}

function freshPlayer(name: string, avatar: string): PlayerState {
  return { name, avatar, score: 0, progress: 0, correctCount: 0, finished: false };
}

interface GameState {
  screen: Screen;
  mode: Mode;
  profile: Profile | null;
  /** Room the player should auto-join after creating a profile (invite link). */
  pendingRoomId: string | null;
  roomId: string | null;
  lobbyStatus: LobbyStatus | null;
  isHost: boolean;
  seed: string;
  /** Difficulty levels for rounds you start (bot games / duels you host). */
  selectedLevels: Level[];
  questions: Question[];
  questionIndex: number;
  phase: Phase;
  /** true once feedback for the current question shows a correct answer */
  lastCorrect: boolean;
  /** Points earned on the last answer (for the +N flash) */
  lastPoints: number;
  combo: number;
  bestComboThisRound: number;
  hearts: number;
  xpEarned: number;
  answers: AnswerRecord[];
  player: PlayerState;
  opponent: PlayerState;
  stats: PersistentStats;
  transport: MatchTransport | null;
  roundFinalized: boolean;
  opponentLeft: boolean;
  rematchRequested: boolean;
  opponentWantsRematch: boolean;

  boot: (roomFromUrl: string | null) => void;
  setProfile: (name: string, avatar: string) => void;
  /** Pull the authoritative profile stats from the server (any-device login). */
  syncProfile: (profile: Profile) => Promise<void>;
  toggleLevel: (level: Level) => void;
  setLevels: (levels: Level[]) => void;
  goHome: () => void;
  openLobby: () => void;
  openFlashcards: () => void;
  startGame: () => Promise<void>;
  createDuel: () => Promise<void>;
  joinDuel: (roomId: string) => Promise<void>;
  retryLobby: () => void;
  requestRematch: () => void;
  submitAnswer: (correct: boolean, timeMs: number) => void;
  nextQuestion: () => void;
  finishRound: () => void;
  showDemoScreen: (screen: "waiting" | "results") => void;
}

const initialProfile = loadProfile();

/** boot() guard — React StrictMode runs mount effects twice in dev. */
let booted = false;

export const useGameStore = create<GameState>((set, get) => {
  /** Common state reset for the start of any round (bot or duel). */
  const roundInitState = (seed: string, questions: Question[]) => {
    const profile = get().profile;
    return {
      seed,
      questions,
      questionIndex: 0,
      phase: "answering" as Phase,
      lastCorrect: false,
      lastPoints: 0,
      combo: 0,
      bestComboThisRound: 0,
      hearts: 3,
      xpEarned: 0,
      answers: [] as AnswerRecord[],
      player: freshPlayer(profile?.name ?? "את/ה", profile?.avatar ?? "🦸"),
      roundFinalized: false,
      opponentLeft: false,
      rematchRequested: false,
      opponentWantsRematch: false,
    };
  };

  /** Opponent-progress handlers shared by bot matches and live duels. */
  const handleOpponentProgress = (
    event:
      | { type: "opponentAnswer"; totalScore: number; progress: number; correct: boolean }
      | { type: "opponentFinished"; totalScore: number; correctCount: number }
  ) => {
    if (event.type === "opponentAnswer") {
      const totalQuestions = get().questions.length || ROUND_SIZE;
      set((s) => ({
        opponent: {
          ...s.opponent,
          score: event.totalScore,
          progress: event.progress,
          correctCount: s.opponent.correctCount + (event.correct ? 1 : 0),
          finished: s.opponent.finished || event.progress >= totalQuestions,
        },
      }));
      if (event.progress >= totalQuestions) get().finishRound();
    } else {
      set((s) => ({
        opponent: {
          ...s.opponent,
          finished: true,
          score: event.totalScore,
          correctCount: event.correctCount,
          progress: Math.max(s.opponent.progress, s.questions.length || ROUND_SIZE),
        },
      }));
      get().finishRound();
    }
  };

  const wireDuelTransport = (transport: RealtimeTransport) => {
    transport.onEvent((event) => {
      // stale transports must not touch state
      if (get().transport !== transport) return;

      switch (event.type) {
        case "roomState": {
          // Alone in the room (host, or a joiner whose host already left):
          // show the share-link waiting UI instead of an endless spinner.
          const s = get();
          if (s.screen === "lobby" && event.players <= 1) {
            set({ lobbyStatus: "waiting" });
          }
          break;
        }

        case "opponentJoined": {
          const s = get();
          const midMatch =
            s.screen === "game" || s.screen === "waiting" || s.screen === "results";
          set({
            opponent: midMatch
              ? { ...s.opponent, name: event.name, avatar: event.avatar }
              : freshPlayer(event.name, event.avatar),
            opponentLeft: false,
            lobbyStatus: s.screen === "lobby" ? "ready" : s.lobbyStatus,
          });
          break;
        }

        case "matchStart": {
          const questions = generateRound(event.seed, event.levels);
          set((s) => ({
            ...roundInitState(event.seed, questions),
            opponent: { ...s.opponent, score: 0, progress: 0, correctCount: 0, finished: false },
            lobbyStatus: "starting",
          }));
          // short "starting" beat so both players see the duel forming
          setTimeout(() => {
            if (get().transport === transport) set({ screen: "game" });
          }, 1200);
          break;
        }

        case "opponentAnswer":
        case "opponentFinished":
          handleOpponentProgress(event);
          break;

        case "opponentWantsRematch":
          set({ opponentWantsRematch: true });
          break;

        case "opponentLeft": {
          const s = get();
          if (s.screen === "lobby") {
            set({ lobbyStatus: "waiting", opponent: freshPlayer("יריב", "❓") });
          } else if (s.screen === "game" || s.screen === "waiting" || s.screen === "results") {
            // freeze their score and let the round finalize
            set({ opponentLeft: true, opponent: { ...s.opponent, finished: true } });
            get().finishRound();
          }
          break;
        }

        case "roomFull":
          set({ lobbyStatus: "full" });
          break;
      }
    });
  };

  const startDuel = async (roomId: string | null) => {
    const s = get();
    s.transport?.dispose();

    const profile = s.profile;
    if (!profile) {
      set({ screen: "profile", pendingRoomId: roomId });
      return;
    }

    const transport = new RealtimeTransport(profile, s.selectedLevels);
    wireDuelTransport(transport);
    set({
      screen: "lobby",
      mode: "duel",
      transport,
      roomId: null,
      isHost: roomId === null,
      lobbyStatus: roomId === null ? "creating" : "joining",
      player: freshPlayer(profile.name, profile.avatar),
      opponent: freshPlayer("יריב", "❓"),
      opponentLeft: false,
      rematchRequested: false,
      opponentWantsRematch: false,
    });

    try {
      const finalRoomId = roomId ?? (await transport.createRoom());
      await transport.joinRoom(finalRoomId);
      if (get().transport !== transport) return;
      set({ roomId: finalRoomId });
    } catch {
      if (get().transport === transport) set({ lobbyStatus: "error" });
      return;
    }

    // The server acks with roomState/opponentJoined; if nothing arrives the
    // realtime server is unreachable — surface an error instead of spinning.
    setTimeout(() => {
      if (get().transport !== transport) return;
      const st = get();
      if (
        st.screen === "lobby" &&
        (st.lobbyStatus === "creating" || st.lobbyStatus === "joining")
      ) {
        set({ lobbyStatus: "error" });
      }
    }, 6000);
  };

  return {
    screen: initialProfile ? "home" : "profile",
    mode: "bot",
    profile: initialProfile,
    pendingRoomId: null,
    roomId: null,
    lobbyStatus: null,
    isHost: false,
    seed: "",
    selectedLevels: loadLevels(),
    questions: [],
    questionIndex: 0,
    phase: "answering",
    lastCorrect: false,
    lastPoints: 0,
    combo: 0,
    bestComboThisRound: 0,
    hearts: 3,
    xpEarned: 0,
    answers: [],
    player: freshPlayer(initialProfile?.name ?? "את/ה", initialProfile?.avatar ?? "🦸"),
    opponent: freshPlayer("בוט", "🤖"),
    stats: loadStats(initialProfile?.name ?? null),
    transport: null,
    roundFinalized: false,
    opponentLeft: false,
    rematchRequested: false,
    opponentWantsRematch: false,

    boot: (roomFromUrl) => {
      // StrictMode mounts effects twice in dev — join the room only once
      if (booted) return;
      booted = true;

      // Returning user: refresh stats from the server (any-device profiles)
      const profile = get().profile;
      if (profile) void get().syncProfile(profile);

      if (!roomFromUrl) return;
      if (profile) {
        void get().joinDuel(roomFromUrl);
      } else {
        set({ screen: "profile", pendingRoomId: roomFromUrl });
      }
    },

    syncProfile: async (profile) => {
      // Server is the source of truth; local stats seed it on first login
      // and remain the offline fallback.
      const server = await loginUser(profile.name, profile.avatar, get().stats);
      if (!server) return;
      if (get().profile?.name !== profile.name) return; // user switched meanwhile
      saveStats(profile.name, server.stats);
      set({ stats: server.stats });
    },

    toggleLevel: (level) => {
      const current = get().selectedLevels;
      const next = current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level];
      // Never allow an empty selection — the last level stays on.
      if (next.length === 0) return;
      const ordered = sanitizeLevels(next);
      saveLevels(ordered);
      set({ selectedLevels: ordered });
    },

    setLevels: (levels) => {
      const ordered = sanitizeLevels(levels);
      saveLevels(ordered);
      set({ selectedLevels: ordered });
    },

    setProfile: (name, avatar) => {
      const profile: Profile = { name: name.trim(), avatar };
      saveProfile(profile);
      set((s) => ({
        profile,
        stats: loadStats(profile.name),
        player: { ...s.player, name: profile.name, avatar: profile.avatar },
      }));
      void get().syncProfile(profile);

      const pending = get().pendingRoomId;
      if (pending) {
        set({ pendingRoomId: null });
        void get().joinDuel(pending);
      } else {
        set({ screen: "home" });
      }
    },

    goHome: () => {
      get().transport?.dispose();
      set({
        screen: "home",
        transport: null,
        mode: "bot",
        roomId: null,
        lobbyStatus: null,
        opponentLeft: false,
        rematchRequested: false,
        opponentWantsRematch: false,
      });
    },

    openLobby: () => {
      void get().createDuel();
    },

    openFlashcards: () => {
      get().transport?.dispose();
      set({ screen: "flashcards", transport: null, mode: "bot" });
    },

    startGame: async () => {
      get().transport?.dispose();

      const seed = randomSeed();
      const questions = generateRound(seed, get().selectedLevels);
      const transport = new BotTransport();

      transport.onEvent((event) => {
        if (get().transport !== transport) return;
        if (event.type === "opponentAnswer" || event.type === "opponentFinished") {
          handleOpponentProgress(event);
        }
      });

      const roomId = await transport.createRoom();
      await transport.joinRoom(roomId);

      set({
        ...roundInitState(seed, questions),
        screen: "game",
        mode: "bot",
        roomId: null,
        lobbyStatus: null,
        opponent: freshPlayer("בוט", "🤖"),
        transport,
      });

      transport.send({
        type: "roundStart",
        seed,
        questionCount: questions.length,
        questionKinds: questions.map((q) => q.kind),
      });
    },

    createDuel: () => startDuel(null),

    joinDuel: (roomId) => startDuel(roomId),

    retryLobby: () => {
      const s = get();
      if (!s.isHost && s.roomId) {
        void get().joinDuel(s.roomId);
      } else {
        void get().createDuel();
      }
    },

    requestRematch: () => {
      const s = get();
      if (s.mode !== "duel" || s.rematchRequested || s.opponentLeft) return;
      s.transport?.send({ type: "rematchRequest" });
      set({ rematchRequested: true });
    },

    submitAnswer: (correct, timeMs) => {
      const s = get();
      if (s.phase !== "answering") return;

      const points = pointsFor(
        correct,
        timeMs,
        questionTimeMs(s.questions[s.questionIndex])
      );
      const combo = correct ? s.combo + 1 : 0;
      const record: AnswerRecord = {
        questionIndex: s.questionIndex,
        correct,
        timeMs,
        points,
      };
      const player: PlayerState = {
        ...s.player,
        score: s.player.score + points,
        progress: s.questionIndex + 1,
        correctCount: s.player.correctCount + (correct ? 1 : 0),
      };

      s.transport?.send({
        type: "playerAnswer",
        questionIndex: s.questionIndex,
        correct,
        points,
        totalScore: player.score,
      });

      set({
        phase: "feedback",
        lastCorrect: correct,
        lastPoints: points,
        combo,
        bestComboThisRound: Math.max(s.bestComboThisRound, combo),
        hearts: correct ? s.hearts : Math.max(0, s.hearts - 1),
        xpEarned: s.xpEarned + (correct ? XP_PER_CORRECT : 0),
        answers: [...s.answers, record],
        player,
      });
    },

    nextQuestion: () => {
      const s = get();
      if (s.questionIndex + 1 < s.questions.length) {
        set({ questionIndex: s.questionIndex + 1, phase: "answering" });
        return;
      }

      // Round finished
      const player: PlayerState = { ...s.player, finished: true };
      const totalQuestions = s.questions.length || ROUND_SIZE;
      const opponentDone = s.opponent.finished || s.opponent.progress >= totalQuestions;
      set({
        screen: opponentDone ? "results" : "waiting",
        player,
      });

      s.transport?.send({
        type: "playerFinished",
        totalScore: player.score,
        correctCount: player.correctCount,
      });

      get().finishRound();
    },

    finishRound: () => {
      const s = get();
      const totalQuestions = s.questions.length || ROUND_SIZE;
      const opponentDone = s.opponent.finished || s.opponent.progress >= totalQuestions;
      if (s.roundFinalized || !s.player.finished || !opponentDone) return;

      const won = s.player.score > s.opponent.score;
      const opponent: PlayerState = {
        ...s.opponent,
        finished: true,
        progress: Math.max(s.opponent.progress, totalQuestions),
      };
      const stats: PersistentStats = {
        totalXp: s.stats.totalXp + s.xpEarned,
        gamesPlayed: s.stats.gamesPlayed + 1,
        wins: s.stats.wins + (won ? 1 : 0),
        bestCombo: Math.max(s.stats.bestCombo, s.bestComboThisRound),
      };
      saveStats(s.profile?.name ?? null, stats);

      set({ screen: "results", opponent, stats, roundFinalized: true });

      // Accumulate on the server too — the profile follows the user across
      // devices. The optimistic local totals above are the offline fallback;
      // the server's answer is authoritative.
      const profileName = s.profile?.name;
      if (profileName) {
        void reportRound(profileName, {
          xp: s.xpEarned,
          won,
          bestCombo: s.bestComboThisRound,
        }).then((server) => {
          if (!server || get().profile?.name !== profileName) return;
          saveStats(profileName, server.stats);
          set({ stats: server.stats });
        });
      }
    },

    showDemoScreen: (screen) => {
      get().transport?.dispose();
      const questions = generateRound(`demo-${screen}`);
      const player: PlayerState = {
        name: "את/ה",
        avatar: "🦸",
        score: screen === "results" ? 1320 : 1245,
        progress: ROUND_SIZE,
        correctCount: screen === "results" ? 9 : 8,
        finished: true,
      };
      const opponent: PlayerState = {
        name: "בוט",
        avatar: "🤖",
        score: screen === "results" ? 1085 : 760,
        progress: screen === "results" ? ROUND_SIZE : 6,
        correctCount: screen === "results" ? 7 : 5,
        finished: screen === "results",
      };

      set({
        screen,
        seed: `demo-${screen}`,
        questions,
        questionIndex: ROUND_SIZE - 1,
        phase: "feedback",
        lastCorrect: true,
        lastPoints: 142,
        combo: 4,
        bestComboThisRound: 5,
        hearts: 2,
        xpEarned: 90,
        answers: questions.map((_, questionIndex) => ({
          questionIndex,
          correct: questionIndex < player.correctCount,
          timeMs: 4200 + questionIndex * 350,
          points: questionIndex < player.correctCount ? 135 - questionIndex : 0,
        })),
        player,
        opponent,
        transport: null,
        roundFinalized: screen === "results",
      });
    },
  };
});

export { ROUND_SIZE };
