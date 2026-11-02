import type {
  Choice,
  GradeCtx,
  GradeResult,
  Item,
  Mode,
  Outcome,
  Payload,
  Question,
  Quiz,
} from "@/game/types";

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function letter(i: number) {
  return "ABCDEFGH"[i] ?? String(i + 1);
}

export function formatScore(n: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

export function formatExam(n: number) {
  const v = Math.round(n * 100) / 100;
  return v.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatClock(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function fold(s: string, keepCase = false) {
  const cleaned = s
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[₂²]/g, "2")
    .replace(/[₃³]/g, "3");
  if (keepCase) return cleaned;
  return cleaned
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: T[], rng: () => number) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export interface Presented {
  choices: Choice[];
  items: Item[];
  left: Item[];
  right: Item[];
}

export function present(q: Question, seed: number): Presented {
  const rng = mulberry32(seed || 1);
  const choices = q.choices ?? [];
  const items = q.items ?? [];
  const pairs = q.pairs ?? [];
  const keep = q.keepOrder === true;
  return {
    choices: keep || choices.length < 2 ? [...choices] : shuffle(choices, rng),
    items:
      q.type === "order" && !keep && items.length > 1
        ? shuffleDistinct(items, rng)
        : q.type === "sort"
          ? shuffle(items, rng)
          : [...items],
    left: pairs.map((p) => ({ id: p.id, text: p.left })),
    right: shuffle(
      pairs.map((p) => ({ id: p.id, text: p.right })),
      rng,
    ),
  };
}

function shuffleDistinct(items: Item[], rng: () => number) {
  const correct = items.map((i) => i.id).join("|");
  let next = shuffle(items, rng);
  for (let n = 0; n < 5 && next.map((i) => i.id).join("|") === correct; n++) {
    next = shuffle(items, rng);
  }
  if (next.map((i) => i.id).join("|") === correct && next.length > 1) {
    const swapped = [...next];
    const first = swapped[0]!;
    swapped[0] = swapped[1]!;
    swapped[1] = first;
    return swapped;
  }
  return next;
}

export function examMax(quiz: Quiz) {
  return quiz.questions.reduce((sum, q) => sum + (q.examWeight ?? 0), 0);
}

export function attackBudgetMs(quiz: Quiz) {
  const n = Math.max(1, poolFor(quiz, "time").length);
  return Math.min(180, Math.max(70, n * 8)) * 1000;
}

export function poolFor(quiz: Quiz, mode: Mode) {
  if (mode === "classic" || mode === "survival") return quiz.questions.map((q) => q.id);
  const timed = quiz.questions.filter((q) => q.type !== "rubric").map((q) => q.id);
  return timed.length ? timed : quiz.questions.map((q) => q.id);
}

export function limitFor(q: Question, mode: Mode, seen: number) {
  if ((mode === "time" || mode === "endless") && q.timeLimit <= 0) return 20;
  if (q.timeLimit <= 0) return 0;
  if (mode === "endless") return Math.max(6, Math.round(q.timeLimit * Math.pow(0.92, seen)));
  return q.timeLimit;
}

function pointsFor(q: Question, outcome: Outcome, ctx: GradeCtx) {
  if (outcome === "wrong") return 0;
  if (outcome === "neutral") return Math.round(q.points * 0.4);
  const limit = ctx.timeLimit;
  const ratio = limit > 0 ? Math.max(0, Math.min(1, (limit - ctx.elapsed) / limit)) : 0;
  const speed = Math.round(q.points * ratio * 0.5);
  const mult = 1 + Math.min(Math.max(0, ctx.streak), 8) * 0.1;
  let gained = Math.round((q.points + speed) * mult);
  if (ctx.hintUsed && ctx.hintPenalty) gained = Math.round(gained * 0.8);
  return gained;
}

export function solutionText(q: Question) {
  switch (q.type) {
    case "mc":
    case "image":
      return (q.choices ?? [])
        .filter((c) => q.correctIds?.includes(c.id))
        .map((c) => c.text)
        .join(", ");
    case "tf":
      return q.tf ? "Đúng" : "Sai";
    case "fill":
      return (q.accepted ?? []).join(" / ");
    case "order":
      return (q.items ?? []).map((i) => i.text).join(" → ");
    case "match":
      return (q.pairs ?? []).map((p) => `${p.left} → ${p.right}`).join("; ");
    case "sort":
      return (q.bins ?? [])
        .map((b) => {
          const names = (q.items ?? []).filter((i) => b.itemIds.includes(i.id)).map((i) => i.text);
          return `${b.label}: ${names.join(", ")}`;
        })
        .join(" · ");
    case "hotspot":
      return q.hotspots?.find((h) => h.id === q.correctHotspot)?.label ?? "";
    case "poll":
      return "Không có đáp án đúng";
    case "rubric":
      return (q.rubric ?? []).join(" ");
    default:
      return "";
  }
}

function pollBars(q: Question, picked: string) {
  const choices = q.choices ?? [];
  const weights = choices.map((c) => ({
    id: c.id,
    text: c.text,
    w: (q.pollWeights?.[c.id] ?? 10) + (c.id === picked ? 8 : 0),
  }));
  const total = weights.reduce((s, w) => s + w.w, 0) || 1;
  return weights
    .map((w) => ({ id: w.id, text: w.text, pct: Math.round((w.w / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

function pack(
  q: Question,
  outcome: Outcome,
  ctx: GradeCtx,
  given: string,
  picked: string[],
  solution: string[],
  answer = solutionText(q),
  poll?: GradeResult["poll"],
): GradeResult {
  return {
    outcome,
    gained: pointsFor(q, outcome, ctx),
    exam: outcome === "correct" ? (q.examWeight ?? 0) : 0,
    given,
    answer,
    picked,
    solution,
    poll,
  };
}

export function grade(q: Question, payload: Payload, ctx: GradeCtx): GradeResult {
  if (payload.type === "timeout") {
    if (q.type === "poll") {
      return pack(q, "neutral", ctx, "Hết giờ", [], [], "Không có đáp án đúng", pollBars(q, ""));
    }
    return pack(q, "wrong", ctx, "Hết giờ", [], q.correctIds ?? (q.correctHotspot ? [q.correctHotspot] : []));
  }

  if (q.type === "poll" && payload.type === "ids") {
    const id = payload.ids[0] ?? "";
    const text = q.choices?.find((c) => c.id === id)?.text ?? "Đã chọn";
    return pack(q, "neutral", ctx, text, id ? [id] : [], [], "Không có đáp án đúng", pollBars(q, id));
  }

  if ((q.type === "mc" || q.type === "image") && payload.type === "ids") {
    const ok = sameIds(payload.ids, q.correctIds ?? []);
    const given =
      (q.choices ?? [])
        .filter((c) => payload.ids.includes(c.id))
        .map((c) => c.text)
        .join(", ") || "Chưa chọn";
    return pack(q, ok ? "correct" : "wrong", ctx, given, payload.ids, q.correctIds ?? []);
  }

  if (q.type === "tf" && payload.type === "bool") {
    const ok = payload.value === Boolean(q.tf);
    return pack(
      q,
      ok ? "correct" : "wrong",
      ctx,
      payload.value ? "Đúng" : "Sai",
      [payload.value ? "true" : "false"],
      [q.tf ? "true" : "false"],
    );
  }

  if (q.type === "fill" && payload.type === "text") {
    const value = payload.value;
    const ok = (q.accepted ?? []).some((a) =>
      q.caseSensitive ? fold(a, true) === fold(value, true) : fold(a) === fold(value),
    );
    return pack(q, ok ? "correct" : "wrong", ctx, value.trim() || "Bỏ trống", [], []);
  }

  if (q.type === "order" && payload.type === "order") {
    const correct = (q.items ?? []).map((i) => i.id);
    const ok = payload.ids.length === correct.length && payload.ids.every((id, i) => id === correct[i]);
    const byId = new Map((q.items ?? []).map((i) => [i.id, i.text]));
    const given = payload.ids.map((id) => byId.get(id) ?? id).join(" → ");
    return pack(q, ok ? "correct" : "wrong", ctx, given, payload.ids, correct);
  }

  if (q.type === "match" && payload.type === "pairs") {
    const need = q.pairs ?? [];
    const ok =
      payload.pairs.length === need.length &&
      need.every((p) => payload.pairs.some((x) => x.left === p.id && x.right === p.id));
    const rightText = new Map(need.map((p) => [p.id, p.right]));
    const given =
      payload.pairs
        .map((p) => {
          const left = need.find((n) => n.id === p.left)?.left ?? p.left;
          return `${left} → ${rightText.get(p.right) ?? "?"}`;
        })
        .join("; ") || "Chưa nối";
    return pack(q, ok ? "correct" : "wrong", ctx, given, [], []);
  }

  if (q.type === "sort" && payload.type === "bins") {
    const items = q.items ?? [];
    const ok = items.every((item) => {
      const bin = (q.bins ?? []).find((b) => b.itemIds.includes(item.id));
      return Boolean(bin && payload.placement[item.id] === bin.id);
    });
    const given =
      items
        .map((item) => {
          const binId = payload.placement[item.id];
          const bin = q.bins?.find((b) => b.id === binId);
          return `${item.text} → ${bin?.label ?? "chưa xếp"}`;
        })
        .join("; ") || "Chưa xếp";
    return pack(q, ok ? "correct" : "wrong", ctx, given, [], []);
  }

  if (q.type === "hotspot" && payload.type === "hotspot") {
    const ok = payload.id === q.correctHotspot;
    const given = q.hotspots?.find((h) => h.id === payload.id)?.label ?? "Chưa chọn";
    return pack(q, ok ? "correct" : "wrong", ctx, given, [payload.id], q.correctHotspot ? [q.correctHotspot] : []);
  }

  if (q.type === "rubric" && payload.type === "rubric") {
    const given = payload.text.trim() || "(không viết)";
    return pack(q, payload.accept ? "correct" : "wrong", ctx, given, [], []);
  }

  return pack(q, "wrong", ctx, "Chưa trả lời", [], []);
}

export function summaryLine(accuracy: number) {
  if (accuracy >= 0.9) return "Chắc tay. Gần như không vấp.";
  if (accuracy >= 0.75) return "Vững. Còn vài chỗ cần xem lại.";
  if (accuracy >= 0.5) return "Đã vào nhịp. Ôn các câu sai là đủ bứt.";
  if (accuracy > 0) return "Mới khởi động. Xem đáp án rồi chơi lại một lượt.";
  return "Chưa có câu đúng. Mở giải thích và thử lại.";
}

export function questionIssues(q: Question): string | null {
  if (!q.prompt.trim()) return "Câu hỏi còn trống.";
  if (q.points < 0 || q.timeLimit < 0) return "Điểm hoặc thời gian không hợp lệ.";
  if (q.type === "mc" || q.type === "image" || q.type === "poll") {
    const choices = q.choices ?? [];
    if (choices.length < 2 || choices.length > 6) return "Cần từ 2 đến 6 phương án.";
    if (choices.some((c) => !c.text.trim())) return "Còn phương án trống.";
    if (q.type !== "poll") {
      const ids = new Set(choices.map((c) => c.id));
      const correct = q.correctIds ?? [];
      if (!correct.length || correct.some((id) => !ids.has(id))) return "Chọn ít nhất một đáp án đúng.";
    }
  }
  if (q.type === "tf" && typeof q.tf !== "boolean") return "Chọn Đúng hoặc Sai.";
  if (q.type === "fill" && !(q.accepted ?? []).some((a) => a.trim())) return "Cần ít nhất một đáp án chấp nhận.";
  if (q.type === "order" && (q.items ?? []).length < 2) return "Cần ít nhất hai mục để sắp xếp.";
  if (q.type === "match" && (q.pairs ?? []).filter((p) => p.left.trim() && p.right.trim()).length < 2) {
    return "Cần ít nhất hai cặp nối.";
  }
  if (q.type === "sort") {
    const items = q.items ?? [];
    const bins = q.bins ?? [];
    if (items.length < 2 || bins.length < 2) return "Cần ít nhất hai nhóm và hai thẻ.";
    const placed = bins.flatMap((b) => b.itemIds);
    if (items.some((i) => !placed.includes(i.id))) return "Mỗi thẻ phải thuộc một nhóm.";
  }
  if (q.type === "hotspot") {
    if ((q.hotspots ?? []).length < 2) return "Cần ít nhất hai vùng chọn.";
    if (!q.hotspots?.some((h) => h.id === q.correctHotspot)) return "Chọn vùng đúng.";
  }
  if (q.type === "rubric" && !(q.rubric ?? []).some((r) => r.trim())) return "Cần đáp án gợi ý để tự chấm.";
  return null;
}

export function quizIssues(quiz: Quiz): string | null {
  if (!quiz.title.trim()) return "Đề cần có tên.";
  if (!quiz.questions.length) return "Đề cần ít nhất một câu.";
  for (const q of quiz.questions) {
    const issue = questionIssues(q);
    if (issue) return issue;
  }
  return null;
}
