import { create } from "zustand";
import {
  attackBudgetMs,
  examMax,
  grade,
  limitFor,
  poolFor,
  quizIssues,
  shuffle,
  summaryLine,
  uid,
} from "@/game/engine";
import { findQuiz, BUILTINS } from "@/game/quizzes";
import { sfx, syncAudio } from "@/game/sound";
import type { Feedback, Log, Mode, Payload, Question, Quiz, RunRecord, Session, Settings } from "@/game/types";

const SETTINGS_KEY = "dau.settings.v1";
const QUIZ_KEY = "dau.quizzes.v1";
const RECORD_KEY = "dau.records.v1";
const LAST_KEY = "dau.last.v1";

const defaultSettings: Settings = {
  sound: true,
  volume: 0.7,
  hintPenalty: true,
  reducedMotion: false,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function rng() {
  return Math.random();
}

function questionById(quiz: Quiz, id: string) {
  return quiz.questions.find((q) => q.id === id);
}

function orderFor(quiz: Quiz, mode: Mode) {
  const ids = poolFor(quiz, mode);
  if (mode === "classic") return ids;
  return shuffle(ids, rng);
}

function enter(session: Session, index: number, lap: number): Session {
  const id = session.order[index];
  const question = id ? questionById(session.quiz, id) : undefined;
  if (!question) return session;
  const seen = session.seen;
  return {
    ...session,
    index,
    lap,
    phase: "ask",
    questionStartedAt: performance.now(),
    timeLimit: limitFor(question, session.mode, seen),
    seed: (Date.now() ^ (index + 1) * 997 ^ lap * 131) >>> 0,
    hintUsed: false,
    hintOpen: false,
    locked: false,
    feedback: null,
  };
}

function finish(session: Session, records: RunRecord[]): { session: Session; record: RunRecord; records: RunRecord[] } {
  const answered = session.correct + session.wrong;
  const accuracy = answered ? session.correct / answered : 0;
  const duration = Math.max(0, Date.now() - session.runStartedAt);
  const prevBest = records
    .filter((r) => r.quizId === session.quiz.id && r.mode === session.mode)
    .reduce((m, r) => Math.max(m, r.score), 0);
  const finishedAll = session.mode === "classic" && session.logs.length >= session.quiz.questions.length;
  const record: RunRecord = {
    id: uid("run"),
    quizId: session.quiz.id,
    quizTitle: session.quiz.title,
    category: session.quiz.category,
    mode: session.mode,
    score: session.score,
    exam: session.exam,
    examMax: examMax(session.quiz),
    correct: session.correct,
    wrong: session.wrong,
    polls: session.polls,
    accuracy,
    avgTime: session.logs.length ? session.answerTimeSum / session.logs.length : 0,
    bestStreak: session.bestStreak,
    duration,
    at: Date.now(),
    logs: session.logs,
    newRecord: session.score > 0 && session.score >= prevBest,
    finishedAll,
  };
  const nextRecords = [record, ...records].slice(0, 40);
  return {
    session: { ...session, phase: "done", locked: true },
    record,
    records: nextRecords,
  };
}

interface State {
  hydrated: boolean;
  settings: Settings;
  custom: Quiz[];
  records: RunRecord[];
  lastRun: RunRecord | null;
  session: Session | null;
  notice: string;
  hydrate: () => void;
  setSettings: (patch: Partial<Settings>) => void;
  saveQuiz: (quiz: Quiz) => boolean;
  deleteQuiz: (id: string) => void;
  importQuizzes: (quizzes: Quiz[]) => boolean;
  startRun: (quiz: Quiz, mode: Mode) => void;
  tickCountdown: () => void;
  revealHint: () => void;
  submit: (payload: Payload) => void;
  expireAttack: () => void;
  continueRun: () => void;
  quit: () => void;
  clearHistory: () => void;
  clearNotice: () => void;
}

export const useGame = create<State>((set, get) => ({
  hydrated: false,
  settings: defaultSettings,
  custom: [],
  records: [],
  lastRun: null,
  session: null,
  notice: "",
  hydrate: () => {
    if (get().hydrated) return;
    const settings = { ...defaultSettings, ...readJson(SETTINGS_KEY, defaultSettings) };
    syncAudio(settings.sound, settings.volume);
    set({
      hydrated: true,
      settings,
      custom: readJson<Quiz[]>(QUIZ_KEY, []),
      records: readJson<RunRecord[]>(RECORD_KEY, []),
      lastRun: readJson<RunRecord | null>(LAST_KEY, null),
    });
  },
  setSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    syncAudio(settings.sound, settings.volume);
    writeJson(SETTINGS_KEY, settings);
    set({ settings });
  },
  saveQuiz: (quiz) => {
    const issue = quizIssues({ ...quiz, builtin: false });
    if (issue) {
      set({ notice: issue });
      return false;
    }
    const next = { ...quiz, builtin: false };
    const custom = [next, ...get().custom.filter((q) => q.id !== next.id)];
    const ok = writeJson(QUIZ_KEY, custom);
    set({ custom, notice: ok ? "" : "Trình duyệt không còn chỗ lưu đề. Hãy xuất JSON để giữ bản sao." });
    return ok;
  },
  deleteQuiz: (id) => {
    const custom = get().custom.filter((q) => q.id !== id);
    writeJson(QUIZ_KEY, custom);
    set({ custom });
  },
  importQuizzes: (quizzes) => {
    const taken = new Set<string>([...BUILTINS.map((q) => q.id), ...get().custom.map((q) => q.id)]);
    const custom = [...get().custom];
    for (const quiz of quizzes) {
      let id = quiz.id;
      if (taken.has(id)) id = uid("quiz");
      taken.add(id);
      custom.unshift({ ...quiz, id, builtin: false });
    }
    const next = custom.slice(0, 40);
    const ok = writeJson(QUIZ_KEY, next);
    set({
      custom: next,
      notice: ok ? `Đã nhập ${quizzes.length} đề.` : "Không lưu được. Đề có thể quá lớn.",
    });
    return ok;
  },
  startRun: (quiz, mode) => {
    const order = orderFor(quiz, mode);
    const attackBudget = attackBudgetMs(quiz);
    const base: Session = {
      quiz: structuredClone(quiz),
      mode,
      order,
      index: 0,
      lap: 1,
      seen: 0,
      lives: mode === "survival" ? 3 : 0,
      score: 0,
      exam: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      wrong: 0,
      polls: 0,
      phase: "countdown",
      countdownN: 3,
      questionStartedAt: 0,
      timeLimit: 0,
      seed: 1,
      attackEndsAt: null,
      attackBudget,
      hintUsed: false,
      hintOpen: false,
      locked: false,
      feedback: null,
      logs: [],
      runStartedAt: Date.now(),
      answerTimeSum: 0,
    };
    set({ session: base, notice: "" });
    sfx("tick");
  },
  tickCountdown: () => {
    const session = get().session;
    if (!session || session.phase !== "countdown") return;
    if (session.countdownN <= 1) {
      const now = performance.now();
      const next = enter(
        {
          ...session,
          attackEndsAt: session.mode === "time" ? now + session.attackBudget : null,
        },
        0,
        1,
      );
      set({ session: { ...next, phase: "ask" } });
      sfx("go");
      return;
    }
    set({ session: { ...session, countdownN: session.countdownN - 1 } });
    sfx("tick");
  },
  revealHint: () => {
    const session = get().session;
    if (!session || session.phase !== "ask" || session.hintOpen) return;
    set({ session: { ...session, hintOpen: true, hintUsed: true } });
  },
  submit: (payload) => {
    const session = get().session;
    if (!session || session.locked || session.phase !== "ask") return;
    const question = questionById(session.quiz, session.order[session.index] ?? "");
    if (!question) return;
    const elapsed = Math.max(0, (performance.now() - session.questionStartedAt) / 1000);
    const timedOut = payload.type === "timeout";
    const result = grade(question, payload, {
      elapsed: timedOut ? session.timeLimit || elapsed : elapsed,
      timeLimit: session.timeLimit,
      streak: session.streak,
      hintUsed: session.hintUsed,
      hintPenalty: get().settings.hintPenalty,
    });
    const streak = result.outcome === "correct" ? session.streak + 1 : result.outcome === "neutral" ? session.streak : 0;
    const log: Log = {
      questionId: question.id,
      kicker: question.kicker,
      prompt: question.prompt,
      type: question.type,
      outcome: result.outcome,
      gained: result.gained,
      exam: result.exam,
      given: result.given,
      answer: result.answer,
      explanation: question.explanation,
      elapsed,
      timedOut,
    };
    const feedback: Feedback = {
      ...result,
      prompt: question.prompt,
      explanation: question.explanation,
      timedOut,
      kicker: question.kicker,
    };
    const lives = session.mode === "survival" && result.outcome === "wrong" ? session.lives - 1 : session.lives;
    set({
      session: {
        ...session,
        locked: true,
        phase: "feedback",
        lives,
        score: session.score + result.gained,
        exam: session.exam + result.exam,
        streak,
        bestStreak: Math.max(session.bestStreak, streak),
        correct: session.correct + (result.outcome === "correct" ? 1 : 0),
        wrong: session.wrong + (result.outcome === "wrong" ? 1 : 0),
        polls: session.polls + (result.outcome === "neutral" ? 1 : 0),
        seen: session.seen + 1,
        feedback,
        logs: [...session.logs, log],
        answerTimeSum: session.answerTimeSum + elapsed,
      },
    });
    if (result.outcome === "wrong") sfx("wrong");
    else if (result.outcome === "correct" && streak > 0 && streak % 3 === 0) sfx("streak");
    else if (result.outcome === "correct") sfx("correct");
    else sfx("tap");
  },
  expireAttack: () => {
    const session = get().session;
    if (!session || session.phase === "done" || session.phase === "countdown") return;
    if (session.phase === "ask" && !session.locked) {
      const question = questionById(session.quiz, session.order[session.index] ?? "");
      if (question) {
        const log: Log = {
          questionId: question.id,
          kicker: question.kicker,
          prompt: question.prompt,
          type: question.type,
          outcome: "wrong",
          gained: 0,
          exam: 0,
          given: "Hết giờ nước rút",
          answer: "",
          explanation: question.explanation,
          elapsed: session.timeLimit,
          timedOut: true,
        };
        const done = finish(
          {
            ...session,
            wrong: session.wrong + 1,
            streak: 0,
            logs: [...session.logs, log],
            seen: session.seen + 1,
          },
          get().records,
        );
        writeJson(RECORD_KEY, done.records);
        writeJson(LAST_KEY, done.record);
        set({ session: done.session, records: done.records, lastRun: done.record });
        sfx("done");
        return;
      }
    }
    const done = finish(session, get().records);
    writeJson(RECORD_KEY, done.records);
    writeJson(LAST_KEY, done.record);
    set({ session: done.session, records: done.records, lastRun: done.record });
    sfx("done");
  },
  continueRun: () => {
    const session = get().session;
    if (!session || session.phase !== "feedback") return;
    const wrongEnded = session.mode === "endless" && session.feedback?.outcome === "wrong";
    const dead = session.mode === "survival" && session.lives <= 0;
    const attackOver = session.mode === "time" && session.attackEndsAt !== null && performance.now() >= session.attackEndsAt;
    const classicOver = session.mode === "classic" && session.index + 1 >= session.order.length;
    if (wrongEnded || dead || attackOver || classicOver) {
      const done = finish(session, get().records);
      writeJson(RECORD_KEY, done.records);
      writeJson(LAST_KEY, done.record);
      set({ session: done.session, records: done.records, lastRun: done.record });
      sfx("done");
      return;
    }
    let order = session.order;
    let index = session.index + 1;
    let lap = session.lap;
    if (index >= order.length) {
      order = shuffle(order, rng);
      index = 0;
      lap += 1;
    }
    set({ session: enter({ ...session, order }, index, lap) });
  },
  quit: () => {
    const session = get().session;
    if (!session || session.phase === "done") return;
    const done = finish(session, get().records);
    writeJson(RECORD_KEY, done.records);
    writeJson(LAST_KEY, done.record);
    set({ session: done.session, records: done.records, lastRun: done.record });
    sfx("done");
  },
  clearHistory: () => {
    writeJson(RECORD_KEY, []);
    writeJson(LAST_KEY, null);
    set({ records: [], lastRun: null });
  },
  clearNotice: () => set({ notice: "" }),
}));

export function bestScore(records: RunRecord[], quizId: string, mode?: Mode) {
  return records
    .filter((r) => r.quizId === quizId && (!mode || r.mode === mode))
    .reduce((m, r) => Math.max(m, r.score), 0);
}

export function currentQuestion(session: Session | null): Question | null {
  if (!session) return null;
  const id = session.order[session.index];
  if (!id) return null;
  return session.quiz.questions.find((q) => q.id === id) ?? null;
}

export function resolveQuiz(id: string) {
  return findQuiz(useGame.getState().custom, id);
}

export { summaryLine };
