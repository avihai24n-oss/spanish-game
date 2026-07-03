import { create } from "zustand";
import type { AnswerRecord, PlayerState, Question } from "./types";
import { ROUND_SIZE, XP_PER_CORRECT } from "./types";
import { generateRound } from "./questionGen";
import { pointsFor } from "./scoring";
import { randomSeed } from "./rng";
import type { MatchTransport } from "../transport/MatchTransport";
import { BotTransport } from "../transport/BotTransport";

export type Screen = "home" | "lobby" | "game" | "results";
export type Phase = "answering" | "feedback";

const STATS_KEY = "vamos-stats-v1";

interface PersistentStats {
  totalXp: number;
  gamesPlayed: number;
  wins: number;
  bestCombo: number;
}

function loadStats(): PersistentStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return { ...defaultStats, ...JSON.parse(raw) };
  } catch {
    // ignore corrupt storage
  }
  return { ...defaultStats };
}

const defaultStats: PersistentStats = {
  totalXp: 0,
  gamesPlayed: 0,
  wins: 0,
  bestCombo: 0,
};

function saveStats(stats: PersistentStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // storage unavailable — stats are best-effort
  }
}

function freshPlayer(name: string, avatar: string): PlayerState {
  return { name, avatar, score: 0, progress: 0, correctCount: 0, finished: false };
}

interface GameState {
  screen: Screen;
  seed: string;
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

  goHome: () => void;
  openLobby: () => void;
  startGame: () => Promise<void>;
  submitAnswer: (correct: boolean, timeMs: number) => void;
  nextQuestion: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: "home",
  seed: "",
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
  player: freshPlayer("את/ה", "🦸"),
  opponent: freshPlayer("בוט", "🤖"),
  stats: loadStats(),
  transport: null,

  goHome: () => {
    get().transport?.dispose();
    set({ screen: "home", transport: null });
  },

  openLobby: () => set({ screen: "lobby" }),

  startGame: async () => {
    get().transport?.dispose();

    const seed = randomSeed();
    const questions = generateRound(seed);
    const transport = new BotTransport();

    transport.onEvent((event) => {
      if (event.type === "opponentAnswer") {
        set((s) => ({
          opponent: {
            ...s.opponent,
            score: event.totalScore,
            progress: event.progress,
            correctCount: s.opponent.correctCount + (event.correct ? 1 : 0),
          },
        }));
      } else if (event.type === "opponentFinished") {
        set((s) => ({
          opponent: { ...s.opponent, finished: true, score: event.totalScore },
        }));
      }
    });

    const roomId = await transport.createRoom();
    await transport.joinRoom(roomId);

    set({
      screen: "game",
      seed,
      questions,
      questionIndex: 0,
      phase: "answering",
      lastCorrect: false,
      lastPoints: 0,
      combo: 0,
      bestComboThisRound: 0,
      hearts: 3,
      xpEarned: 0,
      answers: [],
      player: freshPlayer("את/ה", "🦸"),
      opponent: freshPlayer("בוט", "🤖"),
      transport,
    });

    transport.send({ type: "roundStart", seed, questionCount: questions.length });
  },

  submitAnswer: (correct, timeMs) => {
    const s = get();
    if (s.phase !== "answering") return;

    const points = pointsFor(correct, timeMs);
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
    s.transport?.send({
      type: "playerFinished",
      totalScore: player.score,
      correctCount: player.correctCount,
    });

    const won = player.score >= s.opponent.score;
    const stats: PersistentStats = {
      totalXp: s.stats.totalXp + s.xpEarned,
      gamesPlayed: s.stats.gamesPlayed + 1,
      wins: s.stats.wins + (won ? 1 : 0),
      bestCombo: Math.max(s.stats.bestCombo, s.bestComboThisRound),
    };
    saveStats(stats);

    set({ screen: "results", player, stats });
  },
}));

export { ROUND_SIZE };
