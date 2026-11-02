import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { letter, present } from "@/game/engine";
import type { Outcome, Payload, Question } from "@/game/types";
import { cn } from "@/lib/cn";
import { Mark } from "@/components/marks";

export interface Verdict {
  outcome: Outcome;
  picked: string[];
  solution: string[];
}

const KAHOOT_SHAPES = ["▲", "◆", "●", "■", "★", "✦"];

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

  function tone(id: string, selected: boolean) {
    if (!verdict) return selected ? "picked" : "idle";
    if (verdict.solution.includes(id)) return "good";
    if (verdict.picked.includes(id) || selected) return "bad";
    return "dim";
  }

  if (question.type === "mc" || question.type === "poll") {
    return (
      <div>
        {multi && !verdict && (
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-ink/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink-soft">
            ✨ Chọn mọi đáp án đúng, rồi bấm Chốt!
          </p>
        )}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {view.choices.map((choice, index) => {
            const isEliminated = !verdict && eliminatedIds.includes(choice.id);
            const state = isEliminated ? "dim" : tone(choice.id, picked.includes(choice.id));
            const shape = KAHOOT_SHAPES[index % KAHOOT_SHAPES.length];
            return (
              <button
                key={choice.id}
                type="button"
                disabled={disabled || isEliminated}
                onClick={() => choose(choice.id)}
                className={cn(kahootChoiceClass(index, state), isEliminated && "line-through pointer-events-none opacity-25")}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/20 text-lg font-black text-white shadow-inner">
                  {state === "good" ? (
                    <Check className="size-6 stroke-[3]" />
                  ) : state === "bad" ? (
                    <X className="size-6 stroke-[3]" />
                  ) : (
                    shape
                  )}
                </span>
                <span className="flex-1 text-left text-base font-bold leading-snug sm:text-lg">
                  {choice.text}
                </span>
                <span className="hidden rounded-md bg-black/15 px-2 py-0.5 text-xs font-bold uppercase opacity-80 sm:inline-block">
                  {letter(index)}
                </span>
              </button>
            );
          })}
        </div>
        {multi && !verdict && (
          <Commit disabled={disabled || picked.length === 0} onClick={() => send({ type: "ids", ids: picked })}>
            🚀 Chốt đáp án ({picked.length})
          </Commit>
        )}
      </div>
    );
  }

  if (question.type === "image") {
    return (
      <div className="grid grid-cols-2 gap-3.5">
        {view.choices.map((choice, index) => {
          const state = tone(choice.id, picked.includes(choice.id));
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => choose(choice.id)}
              className={cn(kahootChoiceClass(index, state), "min-h-36 flex-col justify-center text-center")}
            >
              <Mark name={choice.mark ?? "seal"} className="size-14" />
              <span className="font-bold">{choice.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "tf") {
    const options = [
      { id: "true", label: "ĐÚNG", sub: "Chính xác", value: true, colorIdx: 1, icon: "◆" },
      { id: "false", label: "SAI", sub: "Không đúng", value: false, colorIdx: 0, icon: "▲" },
    ];
    return (
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => {
          const state = tone(option.id, false);
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => send({ type: "bool", value: option.value })}
              className={cn(
                kahootChoiceClass(option.colorIdx, state),
                "min-h-32 flex-col justify-center gap-2 text-center",
              )}
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-black/20 text-2xl font-black">
                {state === "good" ? <Check className="size-7 stroke-[3]" /> : state === "bad" ? <X className="size-7 stroke-[3]" /> : option.icon}
              </span>
              <span className="text-2xl font-black tracking-wide">{option.label}</span>
              <span className="text-xs font-medium opacity-80">{option.sub}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "fill") {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send({ type: "text", value: text });
        }}
      >
        <input
          value={text}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          placeholder="Nhập câu trả lời của bạn vào đây..."
          className="w-full rounded-control border-2 border-ink/15 bg-paper-2 px-4 py-3.5 text-lg font-bold text-ink outline-none transition focus:border-stamp focus:bg-white"
          autoComplete="off"
        />
        <Commit disabled={disabled || !text.trim()}>🚀 Chốt đáp án</Commit>
      </form>
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
        <p className="mb-3 text-sm font-semibold text-ink-soft">Sắp xếp theo thứ tự đúng từ trên xuống:</p>
        <ol className="grid gap-2.5">
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
                  "flex items-center gap-3 rounded-control border-2 border-ink/10 bg-paper-2 px-3 py-2.5 font-semibold shadow-sm",
                  good && "border-mint bg-mint/20 text-ink",
                  bad && "border-stamp bg-stamp text-white",
                )}
              >
                <span className="tabular grid size-8 place-items-center rounded-lg bg-ink text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="flex-1 text-base">{byId.get(id) ?? original.get(id)}</span>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-lg bg-black/5 hover:bg-black/10"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label="Đưa lên"
                >
                  <ChevronUp className="size-5" />
                </button>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-lg bg-black/5 hover:bg-black/10"
                  disabled={disabled || index >= order.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label="Đưa xuống"
                >
                  <ChevronDown className="size-5" />
                </button>
              </li>
            );
          })}
        </ol>
        {!verdict && (
          <Commit disabled={disabled} onClick={() => send({ type: "order", ids: order })}>
            🚀 Chốt thứ tự
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
        <p className="mb-3 text-sm font-semibold text-ink-soft">Chọn cột trái, rồi ghép với ý tương ứng ở cột phải:</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2.5">
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
                    "min-h-12 rounded-control border-2 border-ink/10 px-3.5 py-3 text-left font-semibold transition",
                    activeLeft === item.id
                      ? "border-gold bg-gold text-gold-ink scale-[1.02]"
                      : linked
                        ? chip(item.id)
                        : "bg-paper-2 text-ink hover:bg-white",
                  )}
                >
                  {item.text}
                </button>
              );
            })}
          </div>
          <div className="grid gap-2.5">
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
                    "min-h-12 rounded-control border-2 border-ink/10 px-3.5 py-3 text-left font-semibold transition",
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
            🚀 Chốt các cặp
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
        <p className="mb-3 text-sm font-semibold text-ink-soft">Chọn một thẻ, rồi thả vào đúng nhóm:</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {loose.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveItem(item.id)}
              className={cn(
                "min-h-11 rounded-control px-3.5 py-2 font-semibold transition",
                activeItem === item.id ? "bg-gold text-gold-ink ring-2 ring-ink" : "bg-paper-2 text-ink",
              )}
            >
              {item.text}
            </button>
          ))}
          {loose.length === 0 && <p className="text-sm font-semibold text-ink-soft">Đã xếp hết thẻ!</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {bins.map((bin) => {
            const inside = view.items.filter((item) => placement[item.id] === bin.id);
            return (
              <div key={bin.id} className="min-h-28 rounded-control border-2 border-dashed border-ink/20 bg-paper-2 p-3.5 text-left">
                <button
                  type="button"
                  disabled={disabled || !activeItem}
                  onClick={() => {
                    if (!activeItem) return;
                    setPlacement((curr) => ({ ...curr, [activeItem]: bin.id }));
                    setActiveItem(null);
                  }}
                  className="text-sm font-bold uppercase tracking-wider text-stamp disabled:opacity-70"
                >
                  📂 {bin.label}
                </button>
                <span className="mt-2 flex flex-wrap gap-2">
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
                      className="rounded-lg bg-ink px-2.5 py-1.5 text-sm font-semibold text-paper"
                    >
                      {item.text} ✕
                    </button>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
        {!verdict && (
          <Commit disabled={disabled || loose.length > 0} onClick={() => send({ type: "bins", placement })}>
            🚀 Chốt các nhóm
          </Commit>
        )}
      </div>
    );
  }

  if (question.type === "hotspot") {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-paper-2">
        {(question.hotspots ?? []).map((spot, idx) => (
          <button
            key={spot.id}
            type="button"
            disabled={disabled}
            onClick={() => send({ type: "hotspot", id: spot.id })}
            style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
            className={cn(
              "absolute grid place-items-center rounded-control px-2 text-center text-sm font-bold shadow-md",
              kahootChoiceClass(idx, tone(spot.id, false)),
            )}
          >
            {spot.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={essay}
        disabled={disabled}
        onChange={(event) => setEssay(event.target.value)}
        rows={5}
        placeholder="Viết ý chính của bạn..."
        className="w-full resize-y rounded-control border-2 border-ink/15 bg-paper-2 px-4 py-3 text-base font-medium text-ink outline-none focus:border-gold"
      />
      {verdict && (
        <ul className="mt-3 grid gap-2 text-sm leading-relaxed">
          {(question.rubric ?? []).map((line) => (
            <li key={line} className="rounded-control bg-paper-2 px-3 py-2 font-medium">
              • {line}
            </li>
          ))}
        </ul>
      )}
      {!verdict && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={disabled || essay.trim().length < 10}
            onClick={() => send({ type: "rubric", accept: true, text: essay })}
            className="btn-3d kahoot-3 min-h-12 rounded-control px-4 py-3 font-bold text-white disabled:opacity-40"
          >
            ✓ Mình làm tốt
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => send({ type: "rubric", accept: false, text: essay })}
            className="btn-3d kahoot-0 min-h-12 rounded-control px-4 py-3 font-bold text-white"
          >
            ✕ Cần ôn thêm
          </button>
        </div>
      )}
    </div>
  );
}

const PAIR = [
  "bg-[#e21b3c] text-white border-[#9e0e26]",
  "bg-[#1368ce] text-white border-[#0b458c]",
  "bg-[#d89e00] text-white border-[#966c00]",
  "bg-[#26890c] text-white border-[#175906]",
];

function kahootChoiceClass(index: number, state: "idle" | "picked" | "good" | "bad" | "dim") {
  const colorClass = `kahoot-${index % 4}`;
  return cn(
    "btn-3d flex w-full items-center gap-3.5 rounded-2xl px-4 py-4 text-left min-h-[4.25rem]",
    colorClass,
    state === "picked" && "ring-4 ring-white scale-[1.02]",
    state === "good" && "kahoot-good scale-[1.02] ring-4 ring-white",
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
      className="btn-3d mt-5 min-h-13 w-full rounded-2xl bg-gradient-to-r from-[#ff3355] to-[#ff6b00] px-5 py-3.5 text-lg font-extrabold text-white shadow-lg disabled:opacity-40"
    >
      {children}
    </button>
  );
}
