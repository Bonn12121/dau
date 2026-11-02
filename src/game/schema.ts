import { questionIssues, quizIssues, uid } from "@/game/engine";
import type { Difficulty, MarkName, QType, Question, Quiz } from "@/game/types";

const TYPES: QType[] = ["mc", "tf", "fill", "order", "match", "sort", "image", "hotspot", "poll", "rubric"];
const DIFFS: Difficulty[] = ["easy", "medium", "hard", "insane"];
const MARKS = new Set<string>(["seal", "book", "compass", "flame", "leaf", "pin", "bolt", "drop"]);

function asMark(v: string): MarkName | undefined {
  return MARKS.has(v) ? (v as MarkName) : undefined;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function cleanQuestion(raw: unknown, index: number): Question | string {
  if (!isRecord(raw)) return `Câu ${index + 1} không đúng định dạng.`;
  const type = str(raw.type);
  if (!TYPES.includes(type as QType)) return `Câu ${index + 1} có dạng không hỗ trợ.`;
  const q: Question = {
    id: str(raw.id) || uid("q"),
    type: type as QType,
    prompt: str(raw.prompt),
    passage: str(raw.passage) || undefined,
    kicker: str(raw.kicker) || undefined,
    explanation: str(raw.explanation) || undefined,
    hint: str(raw.hint) || undefined,
    image: str(raw.image) || undefined,
    timeLimit: Math.max(0, Math.min(600, num(raw.timeLimit, 30))),
    points: Math.max(0, Math.min(100000, num(raw.points, 1000))),
    examWeight: typeof raw.examWeight === "number" ? raw.examWeight : undefined,
    keepOrder: raw.keepOrder === true,
    caseSensitive: raw.caseSensitive === true,
    tf: typeof raw.tf === "boolean" ? raw.tf : undefined,
    correctHotspot: str(raw.correctHotspot) || undefined,
  };
  if (typeof q.image === "string" && q.image.length > 180_000) return `Ảnh câu ${index + 1} lớn hơn 180KB.`;
  if (Array.isArray(raw.choices)) {
    q.choices = raw.choices.slice(0, 6).map((c, i) => {
      const row = isRecord(c) ? c : {};
      return {
        id: str(row.id) || `c${i}`,
        text: str(row.text),
        mark: asMark(str(row.mark)),
      };
    });
  }
  if (Array.isArray(raw.correctIds)) q.correctIds = raw.correctIds.filter((id) => typeof id === "string");
  if (Array.isArray(raw.accepted)) q.accepted = raw.accepted.filter((a) => typeof a === "string");
  if (Array.isArray(raw.items)) {
    q.items = raw.items.slice(0, 8).map((item, i) => {
      const row = isRecord(item) ? item : {};
      return { id: str(row.id) || `i${i}`, text: str(row.text) };
    });
  }
  if (Array.isArray(raw.pairs)) {
    q.pairs = raw.pairs.slice(0, 6).map((pair, i) => {
      const row = isRecord(pair) ? pair : {};
      return { id: str(row.id) || `p${i}`, left: str(row.left), right: str(row.right) };
    });
  }
  if (Array.isArray(raw.bins)) {
    q.bins = raw.bins.slice(0, 4).map((bin, i) => {
      const row = isRecord(bin) ? bin : {};
      return {
        id: str(row.id) || `b${i}`,
        label: str(row.label),
        itemIds: Array.isArray(row.itemIds) ? row.itemIds.filter((id) => typeof id === "string") : [],
      };
    });
  }
  if (Array.isArray(raw.hotspots)) {
    q.hotspots = raw.hotspots.slice(0, 6).map((spot, i) => {
      const row = isRecord(spot) ? spot : {};
      return {
        id: str(row.id) || `h${i}`,
        x: num(row.x, 0),
        y: num(row.y, 0),
        w: num(row.w, 50),
        h: num(row.h, 50),
        label: str(row.label),
      };
    });
  }
  if (isRecord(raw.pollWeights)) {
    q.pollWeights = {};
    for (const [k, v] of Object.entries(raw.pollWeights)) {
      if (typeof v === "number") q.pollWeights[k] = v;
    }
  }
  if (Array.isArray(raw.rubric)) q.rubric = raw.rubric.filter((r) => typeof r === "string");
  const issue = questionIssues(q);
  if (issue) return `Câu ${index + 1}: ${issue}`;
  return q;
}

export function cleanQuiz(raw: unknown): Quiz | string {
  if (!isRecord(raw)) return "Tệp không phải một đề.";
  const difficulty = str(raw.difficulty, "medium");
  const questionsRaw = Array.isArray(raw.questions) ? raw.questions.slice(0, 80) : [];
  const questions: Question[] = [];
  for (let i = 0; i < questionsRaw.length; i++) {
    const q = cleanQuestion(questionsRaw[i], i);
    if (typeof q === "string") return q;
    questions.push(q);
  }
  const quiz: Quiz = {
    id: str(raw.id) || uid("quiz"),
    title: str(raw.title).slice(0, 140),
    description: str(raw.description).slice(0, 600),
    category: str(raw.category, "Tự soạn").slice(0, 40) || "Tự soạn",
    difficulty: DIFFS.includes(difficulty as Difficulty) ? (difficulty as Difficulty) : "medium",
    questions,
  };
  const issue = quizIssues(quiz);
  if (issue) return issue;
  return quiz;
}

export function parseBundle(data: unknown): { quizzes: Quiz[] } | { error: string } {
  try {
    const payloads: unknown[] = [];
    if (Array.isArray(data)) payloads.push(...data);
    else if (isRecord(data) && Array.isArray(data.quizzes)) payloads.push(...data.quizzes);
    else if (isRecord(data) && isRecord(data.quiz)) payloads.push(data.quiz);
    else payloads.push(data);
    if (!payloads.length) return { error: "Không thấy đề trong tệp." };
    const quizzes: Quiz[] = [];
    for (const raw of payloads.slice(0, 20)) {
      const quiz = cleanQuiz(raw);
      if (typeof quiz === "string") return { error: quiz };
      quizzes.push(quiz);
    }
    return { quizzes };
  } catch {
    return { error: "Không đọc được JSON." };
  }
}

export function exportPayload(quiz: Quiz) {
  const copy: Quiz = { ...quiz, builtin: undefined, questions: quiz.questions.map((q) => ({ ...q })) };
  return { format: "dau-quiz", version: 1, quiz: copy };
}
