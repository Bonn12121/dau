import { useEffect, useMemo, useRef, useState } from "react";
import { detectIdeas, letter, present, solutionText } from "@/game/engine";
import type { Outcome, Payload, Question, TableCell } from "@/game/types";
import { cn } from "@/lib/cn";
import { ChoiceGlyph, Mark } from "@/components/marks";

export interface Verdict {
  outcome: Outcome;
  picked: string[];
  solution: string[];
  ratio?: number;
  hits?: string[];
  misses?: string[];
  marks?: [number, number][];
  given?: string;
}

type Tone = "idle" | "picked" | "good" | "bad" | "dim" | "hidden";

export function QuestionBoard({
  question,
  seed,
  disabled,
  verdict,
  eliminatedIds = [],
  onSubmit,
}: {
  question: Question;
  seed: number;
  disabled?: boolean;
  verdict?: Verdict | null;
  eliminatedIds?: string[];
  onSubmit: (payload: Payload) => void;
}) {
  const view = useMemo(() => present(question, seed), [question, seed]);
  const multi = (question.correctIds?.length ?? 0) > 1;
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Record<string, string>>({});
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [essay, setEssay] = useState("");
  const [drag, setDrag] = useState<number | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    sent.current = false;
    setPicked([]);
    setText("");
    setOrder(view.items.map((item) => item.id));
    setPairs({});
    setActiveLeft(null);
    setPlacement({});
    setActiveItem(null);
    setEssay("");
  }, [question.id, seed, view.items]);

  function send(payload: Payload) {
    if (disabled || sent.current) return;
    sent.current = true;
    onSubmit(payload);
  }

  function choose(id: string) {
    if (disabled || sent.current) return;
    if (question.type === "poll" || !multi) {
      setPicked([id]);
      send({ type: "ids", ids: [id] });
      return;
    }
    setPicked((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (disabled || sent.current) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (question.type === "mc" || question.type === "image" || question.type === "poll") {
        const n = Number(event.key);
        const choice = view.choices[n - 1];
        if (n >= 1 && choice) {
          event.preventDefault();
          choose(choice.id);
        }
      }
      if (question.type === "tf") {
        const key = event.key.toLowerCase();
        if (key === "1" || key === "d") send({ type: "bool", value: true });
        if (key === "2" || key === "s") send({ type: "bool", value: false });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, question.type, view.choices]);

  function tone(id: string, selected: boolean): Tone {
    if (!verdict) return selected ? "picked" : "idle";
    if (verdict.solution.includes(id)) return "good";
    if (verdict.picked.includes(id) || selected) return "bad";
    // Reveal only the answer(s) that matter: hide every other option.
    return question.type === "poll" ? "dim" : "hidden";
  }

  if (question.type === "mc" || question.type === "poll") {
    const shown = view.choices.filter((c) => tone(c.id, picked.includes(c.id)) !== "hidden").length;
    return (
      <div>
        {multi && !verdict && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Chọn tất cả đáp án đúng, rồi bấm Chốt
          </p>
        )}
        <div className={cn("grid gap-3", !(verdict && shown === 1) && "sm:grid-cols-2")}>
          {view.choices.map((choice, index) => {
            const isEliminated = !verdict && eliminatedIds.includes(choice.id);
            const state = isEliminated ? "dim" : tone(choice.id, picked.includes(choice.id));
            if (state === "hidden") return null;
            return (
              <button
                key={choice.id}
                type="button"
                disabled={disabled || isEliminated}
                onClick={() => choose(choice.id)}
                style={{ animationDelay: verdict ? "0ms" : `${index * 55}ms` }}
                className={cn(
                  verdict ? "reveal-in" : "tile-in",
                  kahootChoiceClass(index, state),
                  isEliminated && "line-through pointer-events-none opacity-25",
                )}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-black/20 text-white">
                  <ChoiceGlyph index={index} state={glyphState(state)} className="size-4" />
                </span>
                <span className="flex-1 text-left text-base font-semibold leading-snug">
                  {choice.text}
                </span>
                {!verdict && (
                  <span className="hidden rounded bg-black/15 px-1.5 py-0.5 text-xs font-bold opacity-75 sm:inline-block">
                    {letter(index)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {multi && !verdict && (
          <Commit disabled={disabled || picked.length === 0} onClick={() => send({ type: "ids", ids: picked })}>
            Chốt đáp án ({picked.length})
          </Commit>
        )}
      </div>
    );
  }

  if (question.type === "image") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {view.choices.map((choice, index) => {
          const state = tone(choice.id, picked.includes(choice.id));
          if (state === "hidden") return null;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => choose(choice.id)}
              className={cn(kahootChoiceClass(index, state), "min-h-32 flex-col justify-center text-center", verdict && "reveal-in")}
            >
              <Mark name={choice.mark ?? "seal"} className="size-12" />
              <span className="font-semibold">{choice.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "tf") {
    const options = [
      { id: "true", label: "Đúng", value: true, colorIdx: 1 },
      { id: "false", label: "Sai", value: false, colorIdx: 0 },
    ];
    const visible = options.filter((o) => tone(o.id, false) !== "hidden");
    return (
      <div className={cn("grid gap-3.5", visible.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
        {options.map((option) => {
          const state = tone(option.id, false);
          if (state === "hidden") return null;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => send({ type: "bool", value: option.value })}
              style={{ animationDelay: verdict ? "0ms" : `${option.colorIdx === 1 ? 0 : 60}ms` }}
              className={cn(
                verdict ? "reveal-in" : "tile-in",
                kahootChoiceClass(option.colorIdx, state),
                "min-h-24 justify-center gap-3 text-center text-xl font-bold",
              )}
            >
              <span className="grid size-9 place-items-center rounded-lg bg-black/20">
                <ChoiceGlyph index={option.colorIdx} state={glyphState(state)} className="size-4" />
              </span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "fill") {
    const ok = verdict?.outcome === "correct";
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send({ type: "text", value: text });
        }}
      >
        <div className="relative">
          <input
            value={text}
            disabled={disabled}
            onChange={(event) => setText(event.target.value)}
            placeholder="Gõ đáp án..."
            className={cn(
              "w-full rounded-control border border-ink/15 bg-paper-2 px-4 py-3 text-lg font-semibold text-ink outline-none focus:border-ink",
              verdict && (ok ? "reveal-in border-0 bg-[#26890c] pr-12 text-white" : "reveal-in border-0 bg-[#e21b3c] pr-12 text-white line-through"),
            )}
            autoComplete="off"
          />
          {verdict && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white">
              <ChoiceGlyph index={0} state={ok ? "good" : "bad"} className="size-6" />
            </span>
          )}
        </div>
        {verdict && !ok && <AnswerRow text={solutionText(question)} />}
        {!verdict && <Commit disabled={disabled || !text.trim()}>Chốt đáp án</Commit>}
      </form>
    );
  }

  if (verdict && question.type === "order") {
    const byId = new Map((question.items ?? []).map((item) => [item.id, item.text]));
    const ok = verdict.outcome === "correct";
    return (
      <div className="grid gap-2">
        {(ok ? verdict.solution : order).map((id, index) => {
          const good = verdict.solution[index] === id;
          return (
            <ReviewRow key={id} good={good} n={index + 1}>
              {byId.get(id)}
              {!good && <span className="mt-0.5 block text-xs font-semibold opacity-90">→ Đúng: {byId.get(verdict.solution[index] ?? "")}</span>}
            </ReviewRow>
          );
        })}
      </div>
    );
  }

  if (verdict && question.type === "match") {
    const need = question.pairs ?? [];
    return (
      <div className="grid gap-2">
        {need.map((p, i) => {
          const mine = pairs[p.id];
          const good = mine === p.id;
          const mineText = need.find((x) => x.id === mine)?.right ?? "chưa nối";
          return (
            <ReviewRow key={p.id} good={good} n={i + 1}>
              <span className="font-bold">{p.left}</span> → {good ? p.right : <span className="line-through opacity-80">{mineText}</span>}
              {!good && <span className="mt-0.5 block text-xs font-semibold">→ Đúng: {p.right}</span>}
            </ReviewRow>
          );
        })}
      </div>
    );
  }

  if (verdict && question.type === "sort") {
    const bins = question.bins ?? [];
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {(question.items ?? []).map((item, i) => {
          const right = bins.find((b) => b.itemIds.includes(item.id));
          const mine = bins.find((b) => b.id === placement[item.id]);
          const good = right?.id === mine?.id;
          return (
            <ReviewRow key={item.id} good={good} n={i + 1}>
              <span className="font-bold">{item.text}</span> → {good ? right?.label : <span className="line-through opacity-80">{mine?.label ?? "chưa xếp"}</span>}
              {!good && <span className="mt-0.5 block text-xs font-semibold">→ Đúng: {right?.label}</span>}
            </ReviewRow>
          );
        })}
      </div>
    );
  }

  if (question.type === "essay") {
    return (
      <EssayBoard
        question={question}
        disabled={disabled}
        verdict={verdict}
        text={essay}
        setText={setEssay}
        onSend={() => send({ type: "essay", text: essay })}
      />
    );
  }

  if (question.type === "table" && question.table) {
    return (
      <TableBoard
        key={`${question.id}-${seed}`}
        question={question}
        seed={seed}
        disabled={disabled}
        verdict={verdict}
        onSend={(fill) => send({ type: "table", fill })}
      />
    );
  }

  if (question.type === "order") {
    const byId = new Map(view.items.map((item) => [item.id, item.text]));
    const original = new Map((question.items ?? []).map((item) => [item.id, item.text]));
    function move(from: number, to: number) {
      if (to < 0 || to >= order.length || from === to) return;
      const next = [...order];
      const [item] = next.splice(from, 1);
      if (!item) return;
      next.splice(to, 0, item);
      setOrder(next);
    }
    return (
      <div>
        <p className="mb-2.5 text-xs font-semibold text-ink-soft">Sắp xếp theo thứ tự từ trên xuống:</p>
        <ol className="grid gap-2">
          {order.map((id, index) => {
            const good = verdict ? verdict.solution[index] === id : false;
            const bad = verdict ? !good : false;
            return (
              <li
                key={id}
                draggable={!disabled}
                onDragStart={() => setDrag(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (drag !== null) move(drag, index);
                  setDrag(null);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-control bg-paper-2 px-3 py-2.5 font-medium",
                  good && "bg-[#26890c] text-white",
                  bad && "bg-[#e21b3c] text-white",
                )}
              >
                <span className="tabular grid size-7 place-items-center rounded bg-ink/10 text-xs font-bold">
                  {index + 1}
                </span>
                <span className="flex-1 text-base">{byId.get(id) ?? original.get(id)}</span>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded bg-black/5 hover:bg-black/10"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label="Lên"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded bg-black/5 hover:bg-black/10"
                  disabled={disabled || index >= order.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label="Xuống"
                >
                  ↓
                </button>
              </li>
            );
          })}
        </ol>
        {!verdict && (
          <Commit disabled={disabled} onClick={() => send({ type: "order", ids: order })}>
            Chốt thứ tự
          </Commit>
        )}
      </div>
    );
  }

  if (question.type === "match") {
    const chip = (id: string) => {
      const index = view.left.findIndex((item) => item.id === id || pairs[item.id] === id);
      return PAIR[index % PAIR.length] ?? PAIR[0];
    };
    return (
      <div>
        <p className="mb-2.5 text-xs font-semibold text-ink-soft">Chọn cột trái rồi ghép với cột phải:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            {view.left.map((item) => {
              const linked = pairs[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (linked) {
                      setPairs((curr) => {
                        const next = { ...curr };
                        delete next[item.id];
                        return next;
                      });
                      setActiveLeft(null);
                      return;
                    }
                    setActiveLeft(item.id);
                  }}
                  className={cn(
                    "min-h-12 rounded-control px-3 py-2.5 text-left font-medium transition",
                    activeLeft === item.id
                      ? "bg-gold text-gold-ink"
                      : linked
                        ? chip(item.id)
                        : "bg-paper-2 text-ink",
                  )}
                >
                  {item.text}
                </button>
              );
            })}
          </div>
          <div className="grid gap-2">
            {view.right.map((item) => {
              const owner = Object.entries(pairs).find(([, right]) => right === item.id)?.[0];
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled || (!activeLeft && !owner)}
                  onClick={() => {
                    if (!activeLeft) return;
                    setPairs((curr) => {
                      const next = { ...curr };
                      for (const [left, right] of Object.entries(next)) {
                        if (right === item.id) delete next[left];
                      }
                      next[activeLeft] = item.id;
                      return next;
                    });
                    setActiveLeft(null);
                  }}
                  className={cn(
                    "min-h-12 rounded-control px-3 py-2.5 text-left font-medium transition",
                    owner ? chip(owner) : "bg-paper-2 text-ink",
                  )}
                >
                  {item.text}
                </button>
              );
            })}
          </div>
        </div>
        {!verdict && (
          <Commit
            disabled={disabled || Object.keys(pairs).length < view.left.length}
            onClick={() =>
              send({
                type: "pairs",
                pairs: Object.entries(pairs).map(([left, right]) => ({ left, right })),
              })
            }
          >
            Chốt các cặp
          </Commit>
        )}
      </div>
    );
  }

  if (question.type === "sort") {
    const bins = question.bins ?? [];
    const loose = view.items.filter((item) => !placement[item.id]);
    return (
      <div>
        <p className="mb-2.5 text-xs font-semibold text-ink-soft">Chọn thẻ rồi xếp vào nhóm:</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {loose.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveItem(item.id)}
              className={cn(
                "min-h-10 rounded-control px-3 py-1.5 text-sm font-semibold",
                activeItem === item.id ? "bg-gold text-gold-ink" : "bg-paper-2 text-ink",
              )}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {bins.map((bin) => {
            const inside = view.items.filter((item) => placement[item.id] === bin.id);
            return (
              <div key={bin.id} className="min-h-24 rounded-control bg-paper-2 p-3 text-left">
                <button
                  type="button"
                  disabled={disabled || !activeItem}
                  onClick={() => {
                    if (!activeItem) return;
                    setPlacement((curr) => ({ ...curr, [activeItem]: bin.id }));
                    setActiveItem(null);
                  }}
                  className="text-xs font-bold uppercase tracking-wider text-stamp disabled:opacity-70"
                >
                  {bin.label}
                </button>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {inside.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        setPlacement((curr) => {
                          const next = { ...curr };
                          delete next[item.id];
                          return next;
                        })
                      }
                      className="rounded bg-ink px-2 py-1 text-xs font-semibold text-paper"
                    >
                      {item.text}
                    </button>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
        {!verdict && (
          <Commit disabled={disabled || loose.length > 0} onClick={() => send({ type: "bins", placement })}>
            Chốt các nhóm
          </Commit>
        )}
      </div>
    );
  }

  if (question.type === "hotspot") {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-paper-2">
        {(question.hotspots ?? []).map((spot, idx) => {
          const state = tone(spot.id, false);
          if (state === "hidden") return null;
          return (
            <button
              key={spot.id}
              type="button"
              disabled={disabled}
              onClick={() => send({ type: "hotspot", id: spot.id })}
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
              className={cn(
                "absolute grid place-items-center rounded-control px-2 text-center text-sm font-bold",
                kahootChoiceClass(idx, state),
              )}
            >
              {spot.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={essay}
        disabled={disabled}
        onChange={(event) => setEssay(event.target.value)}
        rows={4}
        placeholder="Viết ý chính..."
        className="w-full resize-y rounded-control bg-paper-2 px-4 py-3 text-base text-ink outline-none"
      />
      {!verdict && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={disabled || essay.trim().length < 5}
            onClick={() => send({ type: "rubric", accept: true, text: essay })}
            className="tile-btn kahoot-3 min-h-11 rounded-control px-4 py-2.5 font-bold text-white disabled:opacity-40"
          >
            Đạt
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => send({ type: "rubric", accept: false, text: essay })}
            className="tile-btn kahoot-0 min-h-11 rounded-control px-4 py-2.5 font-bold text-white"
          >
            Chưa đạt
          </button>
        </div>
      )}
    </div>
  );
}

const PAIR = [
  "bg-[#e21b3c] text-white",
  "bg-[#1368ce] text-white",
  "bg-[#d89e00] text-white",
  "bg-[#26890c] text-white",
];

function kahootChoiceClass(index: number, state: Tone) {
  const colorClass = `kahoot-${index % 4}`;
  return cn(
    "tile-btn flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left min-h-15",
    colorClass,
    state === "picked" && "ring-3 ring-white",
    state === "good" && "kahoot-good ring-3 ring-white ping",
    state === "bad" && "kahoot-bad",
    state === "dim" && "kahoot-dim",
  );
}

function Commit({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={onClick}
      className="tile-btn mt-4 min-h-12 w-full rounded-xl bg-ink px-4 py-3 font-bold text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function glyphState(t: Tone): "idle" | "picked" | "good" | "bad" | "dim" {
  return t === "hidden" ? "dim" : t;
}

function AnswerRow({ text }: { text: string }) {
  return (
    <div className="reveal-in mt-3 flex items-start gap-3 rounded-control bg-[#26890c] px-4 py-3 text-white">
      <ChoiceGlyph index={0} state="good" className="mt-0.5 size-5 shrink-0" />
      <span className="font-semibold">{text}</span>
    </div>
  );
}

function ReviewRow({ good, n, children }: { good: boolean; n: number; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "reveal-in flex items-start gap-2.5 rounded-control px-3 py-2.5 text-white",
        good ? "bg-[#26890c]" : "bg-[#e21b3c]",
      )}
      style={{ animationDelay: `${n * 40}ms` }}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded bg-black/20">
        <ChoiceGlyph index={0} state={good ? "good" : "bad"} className="size-4" />
      </span>
      <span className="flex-1 text-sm font-medium leading-snug">{children}</span>
    </div>
  );
}

/* ---------------- Essay: free answer, keyword detector ---------------- */

function EssayBoard({
  question,
  disabled,
  verdict,
  text,
  setText,
  onSend,
}: {
  question: Question;
  disabled?: boolean;
  verdict?: Verdict | null;
  text: string;
  setText: (s: string) => void;
  onSend: () => void;
}) {
  const ideas = question.ideas ?? [];
  const live = useMemo(() => detectIdeas(text, ideas), [text, ideas]);
  const pct = ideas.length ? live.hits.length / ideas.length : 0;

  if (verdict) {
    const ratio = verdict.ratio ?? 0;
    const chars = Array.from(verdict.given ?? text);
    const marks = verdict.marks ?? [];
    const pieces: { s: string; hit: boolean }[] = [];
    let i = 0;
    for (const [a, b] of marks) {
      if (a < i) continue;
      if (a > i) pieces.push({ s: chars.slice(i, a).join(""), hit: false });
      pieces.push({ s: chars.slice(a, b).join(""), hit: true });
      i = b;
    }
    if (i < chars.length) pieces.push({ s: chars.slice(i).join(""), hit: false });
    return (
      <div className="grid gap-3">
        <div className="reveal-in rounded-control bg-paper-2 p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-soft">
            <span>Bài của bạn · từ khóa được tô sáng</span>
            <span className="tabular text-ink">{Math.round(ratio * 100)}%</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {pieces.map((p, k) =>
              p.hit ? (
                <mark key={k} className="rounded bg-[#26890c] px-0.5 font-bold text-white">
                  {p.s}
                </mark>
              ) : (
                <span key={k}>{p.s}</span>
              ),
            )}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
            <div className={cn("h-full", ratio >= (question.pass ?? 0.5) ? "bg-[#26890c]" : "bg-[#e21b3c]")} style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(verdict.hits ?? []).map((h, n) => (
            <ReviewRow key={h} good n={n}>
              {h}
            </ReviewRow>
          ))}
          {(verdict.misses ?? []).map((m, n) => (
            <ReviewRow key={m} good={false} n={n + 3}>
              Thiếu ý: {m}
            </ReviewRow>
          ))}
        </div>
        {question.model && (
          <div className="reveal-in rounded-control border-2 border-[#26890c] bg-[#26890c]/10 p-3 text-sm leading-relaxed text-ink">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1d6b09]">Đáp án gợi ý</span>
            {question.model}
          </div>
        )}
        <p className="text-center text-xs font-semibold text-ink-soft">Chạm vào thẻ để sang câu tiếp</p>
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={text}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        placeholder="Viết câu trả lời của bạn… máy sẽ dò các ý / từ khóa chính để chấm điểm."
        className="w-full resize-y rounded-control border border-ink/15 bg-paper-2 px-4 py-3 text-base leading-relaxed text-ink outline-none focus:border-ink"
      />
      <div className="mt-2 flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-label={`Đã nhận diện ${live.hits.length}/${ideas.length} ý`}>
          {ideas.map((_, n) => (
            <span
              key={n}
              className={cn(
                "h-2.5 flex-1 rounded-full transition-colors duration-300",
                n < live.hits.length ? "bg-[#26890c]" : "bg-ink/10",
              )}
            />
          ))}
        </div>
        <span className="tabular text-xs font-bold text-ink-soft">
          {live.hits.length}/{ideas.length} ý
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {pct === 0 ? "Máy dò từ khóa đang chờ…" : pct < (question.pass ?? 0.5) ? "Đang lên điểm — thêm ý nữa!" : "Đủ ý để qua. Viết thêm để ăn trọn điểm."}
      </p>
      <Commit disabled={disabled || text.trim().length < 5} onClick={onSend}>
        Nộp bài
      </Commit>
    </div>
  );
}

/* ---------------- Table: chip bank → blanks ---------------- */

function TableBoard({
  question,
  seed,
  disabled,
  verdict,
  onSend,
}: {
  question: Question;
  seed: number;
  disabled?: boolean;
  verdict?: Verdict | null;
  onSend: (fill: Record<string, string>) => void;
}) {
  const spec = question.table!;
  const chips = useMemo(() => {
    const all = [...Object.values(spec.answers), ...(spec.decoys ?? [])];
    let s = seed || 7;
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    return all.map((t) => ({ t, k: rnd() })).sort((a, b) => a.k - b.k).map((x) => x.t);
  }, [spec, seed]);
  const [fill, setFill] = useState<Record<string, string>>({});
  const [chip, setChip] = useState<string | null>(null);
  const [cell, setCell] = useState<string | null>(null);
  const used = new Set(Object.values(fill));
  const blanks = Object.keys(spec.answers);

  function place(blank: string, value: string) {
    setFill((curr) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(curr)) if (v !== value) next[k] = v;
      next[blank] = value;
      return next;
    });
    setChip(null);
    setCell(null);
  }

  function renderCell(c: TableCell, key: string) {
    if (typeof c === "string") return <td key={key} className="p-2 align-top text-sm text-ink">{c}</td>;
    const id = c.blank;
    const val = fill[id];
    if (verdict) {
      const ok = val === spec.answers[id];
      return (
        <td key={key} className="p-1.5 align-top">
          <div className={cn("reveal-in flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-white", ok ? "bg-[#26890c]" : "bg-[#e21b3c]")}>
            <ChoiceGlyph index={0} state={ok ? "good" : "bad"} className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {ok ? val : <span className="line-through opacity-80">{val ?? "(trống)"}</span>}
              {!ok && <span className="mt-0.5 block">→ {spec.answers[id]}</span>}
            </span>
          </div>
        </td>
      );
    }
    return (
      <td key={key} className="p-1.5 align-top">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (chip) place(id, chip);
            else if (val) setFill((curr) => { const n = { ...curr }; delete n[id]; return n; });
            else setCell(cell === id ? null : id);
          }}
          className={cn(
            "min-h-12 w-full rounded-lg border-2 border-dashed px-2 py-1.5 text-left text-xs font-semibold transition",
            val ? "border-transparent bg-[#1368ce] text-white" : cell === id ? "border-gold bg-gold/20 text-ink" : chip ? "border-[#1368ce] bg-[#1368ce]/10 text-ink-soft" : "border-ink/20 text-ink-soft",
          )}
        >
          {val ?? (chip ? "Đặt vào đây" : "Chạm để chọn ô")}
        </button>
      </td>
    );
  }

  return (
    <div>
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-0 overflow-hidden rounded-control bg-paper-2">
          <thead>
            <tr>
              {spec.headers.map((h) => (
                <th key={h} className="bg-ink px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((row, r) => (
              <tr key={r} className="border-t border-ink/10">
                {row.map((c, ci) => (ci === 0 && typeof c === "string" ? <th key={ci} className="p-2 text-left align-top text-sm font-bold text-ink">{c}</th> : renderCell(c, `${r}-${ci}`)))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!verdict && (
        <>
          <p className="mb-2 mt-4 text-xs font-semibold text-ink-soft">Kho thẻ — chọn thẻ rồi chạm ô (có thẻ gây nhiễu!):</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((t) => {
              const isUsed = used.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  disabled={disabled || isUsed}
                  onClick={() => {
                    if (cell) place(cell, t);
                    else setChip(chip === t ? null : t);
                  }}
                  className={cn(
                    "min-h-10 rounded-lg px-3 py-1.5 text-left text-xs font-semibold transition",
                    isUsed ? "bg-ink/5 text-ink/30 line-through" : chip === t ? "bg-gold text-gold-ink ring-2 ring-ink" : "bg-white text-ink shadow-sm hover:bg-ink/5",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <Commit disabled={disabled || Object.keys(fill).length < blanks.length} onClick={() => onSend(fill)}>
            Chốt bảng ({Object.keys(fill).length}/{blanks.length})
          </Commit>
        </>
      )}
      {verdict && question.explanation && <p className="mt-3 text-sm text-ink-soft">{question.explanation}</p>}
      {verdict && <p className="mt-2 text-center text-xs font-semibold text-ink-soft">Chạm vào thẻ để sang câu tiếp</p>}
    </div>
  );
}
