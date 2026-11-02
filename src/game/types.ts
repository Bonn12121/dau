export type Mode = "classic" | "time" | "survival" | "endless";

export type Difficulty = "easy" | "medium" | "hard" | "insane";

export type QType =
  | "mc"
  | "tf"
  | "fill"
  | "order"
  | "match"
  | "sort"
  | "image"
  | "hotspot"
  | "poll"
  | "rubric";

export type MarkName = "seal" | "book" | "compass" | "flame" | "leaf" | "pin" | "bolt" | "drop";

export interface Choice {
  id: string;
  text: string;
  mark?: MarkName;
}

export interface Item {
  id: string;
  text: string;
}

export interface Pair {
  id: string;
  left: string;
  right: string;
}

export interface Bin {
  id: string;
  label: string;
  itemIds: string[];
}

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface Question {
  id: string;
  type: QType;
  prompt: string;
  passage?: string;
  kicker?: string;
  explanation?: string;
  hint?: string;
  image?: string;
  timeLimit: number;
  points: number;
  examWeight?: number;
  keepOrder?: boolean;
  choices?: Choice[];
  correctIds?: string[];
  tf?: boolean;
  accepted?: string[];
  caseSensitive?: boolean;
  items?: Item[];
  pairs?: Pair[];
  bins?: Bin[];
  hotspots?: Hotspot[];
  correctHotspot?: string;
  pollWeights?: Record<string, number>;
  rubric?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  builtin?: boolean;
  questions: Question[];
}

export type Outcome = "correct" | "wrong" | "neutral";

export type Payload =
  | { type: "ids"; ids: string[] }
  | { type: "bool"; value: boolean }
  | { type: "text"; value: string }
  | { type: "order"; ids: string[] }
  | { type: "pairs"; pairs: { left: string; right: string }[] }
  | { type: "bins"; placement: Record<string, string> }
  | { type: "hotspot"; id: string }
  | { type: "rubric"; accept: boolean; text: string }
  | { type: "timeout" };

export interface GradeCtx {
  elapsed: number;
  timeLimit: number;
  streak: number;
  hintUsed: boolean;
  hintPenalty: boolean;
}

export interface GradeResult {
  outcome: Outcome;
  gained: number;
  exam: number;
  given: string;
  answer: string;
  picked: string[];
  solution: string[];
  poll?: { id: string; text: string; pct: number }[];
}

export interface Log {
  questionId: string;
  kicker?: string;
  prompt: string;
  type: QType;
  outcome: Outcome;
  gained: number;
  exam: number;
  given: string;
  answer: string;
  explanation?: string;
  elapsed: number;
  timedOut: boolean;
}

export interface Feedback extends GradeResult {
  prompt: string;
  explanation?: string;
  timedOut: boolean;
  kicker?: string;
}

export interface Session {
  quiz: Quiz;
  mode: Mode;
  order: string[];
  questionLimit?: number;
  index: number;
  lap: number;
  seen: number;
  lives: number;
  score: number;
  exam: number;
  streak: number;
  bestStreak: number;
  correct: number;
  wrong: number;
  polls: number;
  phase: "countdown" | "ask" | "feedback" | "done";
  countdownN: number;
  questionStartedAt: number;
  timeLimit: number;
  seed: number;
  attackEndsAt: number | null;
  attackBudget: number;
  hintUsed: boolean;
  hintOpen: boolean;
  locked: boolean;
  feedback: Feedback | null;
  logs: Log[];
  runStartedAt: number;
  answerTimeSum: number;
}

export interface RunRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  category: string;
  mode: Mode;
  score: number;
  exam: number;
  examMax: number;
  correct: number;
  wrong: number;
  polls: number;
  accuracy: number;
  avgTime: number;
  bestStreak: number;
  duration: number;
  at: number;
  logs: Log[];
  newRecord: boolean;
  finishedAll: boolean;
  questionLimit?: number;
}

export interface Settings {
  sound: boolean;
  volume: number;
  hintPenalty: boolean;
  reducedMotion: boolean;
}

export const MODES: { id: Mode; name: string; en: string; blurb: string }[] = [
  {
    id: "classic",
    name: "Cổ điển",
    en: "Classic",
    blurb: "Đi hết đề. Điểm cộng tốc độ và chuỗi đúng.",
  },
  {
    id: "time",
    name: "Nước rút",
    en: "Time attack",
    blurb: "Làm càng nhiều câu càng tốt trước khi hết giờ.",
  },
  {
    id: "survival",
    name: "Sinh tồn",
    en: "Survival",
    blurb: "Ba mạng. Sai một câu là mất một mạng.",
  },
  {
    id: "endless",
    name: "Bất tận",
    en: "Endless",
    blurb: "Càng về sau càng ít thời gian. Sai một câu là dừng.",
  },
];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó",
  insane: "Siêu khó",
};

export const TYPE_LABEL: Record<QType, string> = {
  mc: "Nhiều lựa chọn",
  tf: "Đúng / Sai",
  fill: "Điền chỗ trống",
  order: "Sắp xếp",
  match: "Nối cặp",
  sort: "Kéo vào nhóm",
  image: "Câu ảnh",
  hotspot: "Chọn trên hình",
  poll: "Thăm dò",
  rubric: "Tự luận",
};
