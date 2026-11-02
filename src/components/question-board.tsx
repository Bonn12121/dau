import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { letter, present } from "@/game/engine";
import type { Outcome, Payload, Question } from "@/game/types";
import { cn } from "@/lib/cn";
import { Mark } from "@/components/marks";

export interface Verdict {
  outcome: Outcome;
  picked: string[];
  solution: string[];
}

export function QuestionBoard({
  question,
  seed,
  disabled,
  verdict,
  onSubmit,
}: {
  question: Question;
  seed: number;
  disabled?: boolean;
  verdict?: Verdict | null;
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
          <p className="mb-3 text-sm text-ink-soft">Chọn mọi ý đúng, rồi chốt.</p>
        )}
        <div className="grid gap-2">
          {view.choices.map((choice, index) => {
            const state = tone(choice.id, picked.includes(choice.id));
            return (
              <button
                key={choice.id}
                type="button"
                disabled={disabled}
                onClick={() => choose(choice.id)}
                className={choiceClass(state)}
              >
                <span className={letterClass(state)}>{letter(index)}</span>
                <span className="text-base leading-snug">{choice.text}</span>
              </button>
            );
          })}
        </div>
        {multi && !verdict && (
          <Commit disabled={disabled || picked.length === 0} onClick={() => send({ type: "ids", ids: picked })}>
            Chốt đáp án
          </Commit>
        )}
      </div>
    );
  }

  if (question.type === "image") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {view.choices.map((choice) => {
          const state = tone(choice.id, picked.includes(choice.id));
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => choose(choice.id)}
              className={cn(choiceClass(state), "min-h-32 flex-col justify-center text-center")}
            >
              <Mark name={choice.mark ?? "seal"} className="size-14" />
              <span>{choice.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "tf") {
    const options = [
      { id: "true", label: "Đúng", value: true },
      { id: "false", label: "Sai", value: false },
    ];
    return (
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => send({ type: "bool", value: option.value })}
            className={cn(choiceClass(tone(option.id, false)), "min-h-28 justify-center text-2xl font-semibold")}
          >
            {option.label}
          </button>
        ))}
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
          placeholder="Gõ đáp án"
          className="w-full rounded-control bg-paper-2 px-4 py-3 text-lg text-ink outline-none ring-1 ring-ink/15 focus:ring-gold"
          autoComplete="off"
        />
        <Commit disabled={disabled || !text.trim()}>Chốt đáp án</Commit>
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
        <p className="mb-3 text-sm text-ink-soft">Thứ tự từ trên xuống. Kéo hoặc dùng mũi tên.</p>
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
                  "flex items-center gap-2 rounded-control bg-paper-2 px-2 py-2",
                  good && "bg-gold text-gold-ink",
                  bad && "bg-stamp text-stamp-ink",
                )}
              >
                <span className="tabular w-6 text-center text-sm">{index + 1}</span>
                <span className="flex-1 text-base">{byId.get(id) ?? original.get(id)}</span>
                <button type="button" className="grid size-11 place-items-center rounded-control" disabled={disabled || index === 0} onClick={() => move(index, index - 1)} aria-label="Đưa lên">
                  <ChevronUp className="size-5" />
                </button>
                <button type="button" className="grid size-11 place-items-center rounded-control" disabled={disabled || index === order.length - 1} onClick={() => move(index, index + 1)} aria-label="Đưa xuống">
                  <ChevronDown className="size-5" />
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
    const usedRight = new Set(Object.values(pairs));
    const chip = (id: string) => {
      const index = view.left.findIndex((item) => item.id === id || pairs[item.id] === id);
      return PAIR[index] ?? PAIR[0];
    };
    return (
      <div>
        <p className="mb-3 text-sm text-ink-soft">Chọn bên trái, rồi chọn ý tương ứng bên phải.</p>
        <div className="grid gap-4 sm:grid-cols-2">
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
                    "min-h-12 rounded-control px-3 py-3 text-left",
                    activeLeft === item.id ? "bg-gold text-gold-ink" : linked ? chip(item.id) : "bg-paper-2 text-ink",
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
                    "min-h-12 rounded-control px-3 py-3 text-left",
                    owner ? chip(owner) : "bg-paper-2 text-ink",
                    usedRight.has(item.id) ? "" : "",
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
        <p className="mb-3 text-sm text-ink-soft">Chọn một thẻ, rồi chọn nhóm.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {loose.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveItem(item.id)}
              className={cn(
                "min-h-11 rounded-control px-3 py-2",
                activeItem === item.id ? "bg-gold text-gold-ink" : "bg-paper-2 text-ink",
              )}
            >
              {item.text}
            </button>
          ))}
          {loose.length === 0 && <p className="text-sm text-ink-soft">Đã xếp hết thẻ.</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {bins.map((bin) => {
            const inside = view.items.filter((item) => placement[item.id] === bin.id);
            return (
              <div key={bin.id} className="min-h-28 rounded-control bg-paper-2 p-3 text-left">
                <button
                  type="button"
                  disabled={disabled || !activeItem}
                  onClick={() => {
                    if (!activeItem) return;
                    setPlacement((curr) => ({ ...curr, [activeItem]: bin.id }));
                    setActiveItem(null);
                  }}
                  className="text-sm font-semibold disabled:opacity-70"
                >
                  {bin.label}
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
                      className="rounded-control bg-ink px-2 py-1 text-sm text-paper"
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
          <Commit
            disabled={disabled || loose.length > 0}
            onClick={() => send({ type: "bins", placement })}
          >
            Chốt các nhóm
          </Commit>
        )}
      </div>
    );
  }

  if (question.type === "hotspot") {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-paper-2">
        {(question.hotspots ?? []).map((spot) => (
          <button
            key={spot.id}
            type="button"
            disabled={disabled}
            onClick={() => send({ type: "hotspot", id: spot.id })}
            style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
            className={cn(
              "absolute grid place-items-center rounded-control px-2 text-center text-sm font-medium",
              tone(spot.id, false) === "good" && "bg-gold text-gold-ink",
              tone(spot.id, false) === "bad" && "bg-stamp text-stamp-ink",
              tone(spot.id, false) === "dim" && "bg-ink/10 text-ink-soft",
              tone(spot.id, false) === "idle" && "bg-paper text-ink ring-1 ring-ink/10",
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
        placeholder="Viết ý chính của em"
        className="w-full resize-y rounded-control bg-paper-2 px-4 py-3 text-base text-ink outline-none ring-1 ring-ink/15 focus:ring-gold"
      />
      {verdict && (
        <ul className="mt-3 grid gap-2 text-sm leading-relaxed">
          {(question.rubric ?? []).map((line) => (
            <li key={line} className="rounded-control bg-paper-2 px-3 py-2">
              {line}
            </li>
          ))}
        </ul>
      )}
      {!verdict && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={disabled || essay.trim().length < 10}
            onClick={() => send({ type: "rubric", accept: true, text: essay })}
            className="min-h-12 rounded-control bg-ink px-4 py-3 font-semibold text-paper disabled:opacity-40"
          >
            Mình làm được
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => send({ type: "rubric", accept: false, text: essay })}
            className="min-h-12 rounded-control bg-paper-2 px-4 py-3 font-semibold text-ink"
          >
            Chưa đạt
          </button>
        </div>
      )}
    </div>
  );
}

const PAIR = ["bg-gold text-gold-ink", "bg-stamp text-stamp-ink", "bg-ink text-paper", "bg-stage text-paper"];

function choiceClass(state: "idle" | "picked" | "good" | "bad" | "dim") {
  return cn(
    "flex w-full items-center gap-3 rounded-control px-3 py-3 text-left min-h-12",
    state === "idle" && "bg-paper-2 text-ink hover:bg-paper",
    state === "picked" && "bg-paper text-ink ring-2 ring-gold",
    state === "good" && "bg-gold text-gold-ink",
    state === "bad" && "bg-stamp text-stamp-ink",
    state === "dim" && "bg-paper-2 text-ink-soft",
  );
}

function letterClass(state: "idle" | "picked" | "good" | "bad" | "dim") {
  return cn(
    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
    state === "good" && "bg-gold-ink/15",
    state === "bad" && "bg-stamp-ink/15",
    state !== "good" && state !== "bad" && "bg-ink text-paper",
  );
}

function Commit({
  children,
  disabled,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={onClick}
      className="mt-4 min-h-12 w-full rounded-control bg-ink px-4 py-3 font-semibold text-paper disabled:opacity-40"
    >
      {children}
    </button>
  );
}
