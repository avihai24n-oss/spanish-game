import { create } from "zustand";
import type { AnswerRecord, PlayerState, Question } from "./types";
import { ROUND_SIZE, XP_PER_CORRECT, questionTimeMs } from "./types";
import { generateRound } from "./questionGen";
import { pointsFor } from "./scoring";
import { randomSeed } from "./rng";
import type { MatchTransport } from "../transport/MatchTransport";
import { BotTransport } from "../transport/BotTransport";

export type Screen = "home" | "lobby" | "game" | "waiting" | "results";
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
  roundFinalized: boolean;

  goHome: () => void;
  openLobby: () => void;
  startGame: () => Promise<void>;
  submitAnswer: (correct: boolean, timeMs: number) => void;
  nextQuestion: () => void;
  finishRound: () => void;
  showDemoScreen: (screen: "waiting" | "results") => void;
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
  roundFinalized: false,

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
      } else if (event.type === "opponentFinished") {
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
      roundFinalized: false,
    });

    transport.send({
      type: "roundStart",
      seed,
      questionCount: questions.length,
      questionKinds: questions.map((q) => q.kind),
    });
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
    saveStats(stats);

    set({ screen: "results", opponent, stats, roundFinalized: true });
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
}));

export { ROUND_SIZE };
