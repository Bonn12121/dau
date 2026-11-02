import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { useLaunch } from "@/components/use-launch";
import { formatScore } from "@/game/engine";
import { allQuizzes } from "@/game/quizzes";
import { parseBundle } from "@/game/schema";
import { bestScore, useGame } from "@/game/store";
import { DIFFICULTY_LABEL, MODES, type Mode } from "@/game/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/library")({ component: Library });

function Library() {
  const custom = useGame((s) => s.custom);
  const records = useGame((s) => s.records);
  const importQuizzes = useGame((s) => s.importQuizzes);
  const deleteQuiz = useGame((s) => s.deleteQuiz);
  const launch = useLaunch();
  const [mode, setMode] = useState<Mode>("classic");
  const [customCount, setCustomCount] = useState<number | null>(null);
  const [cat, setCat] = useState("Tất cả");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const quizzes = allQuizzes(custom);
  const cats = useMemo(() => ["Tất cả", ...Array.from(new Set(quizzes.map((quiz) => quiz.category)))], [quizzes]);
  const shown = quizzes.filter((quiz) => {
    if (cat !== "Tất cả" && quiz.category !== cat) return false;
    if (!q.trim()) return true;
    return quiz.title.toLowerCase().includes(q.trim().toLowerCase());
  });

  const ACCENTS = ["border-t-[#e21b3c]", "border-t-[#1368ce]", "border-t-[#26890c]", "border-t-[#d89e00]"];

  return (
    <Shell wide>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Tủ đề</p>
          <h1 className="font-serif text-4xl font-extrabold text-white">Chọn đề luyện tập</h1>
        </div>
        <div className="flex gap-2">
          <label className="grid min-h-10 cursor-pointer place-items-center rounded-control bg-stage-soft px-3.5 text-xs font-bold text-white hover:bg-line">
            Nhập JSON
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                try {
                  const parsed = parseBundle(JSON.parse(await file.text()));
                  if ("error" in parsed) setError(parsed.error);
                  else {
                    setError("");
                    importQuizzes(parsed.quizzes);
                  }
                } catch {
                  setError("Tệp không phải JSON.");
                }
              }}
            />
          </label>
          <Link
            to="/studio"
            search={{ id: "" }}
            className="grid min-h-10 place-items-center rounded-control bg-paper px-3.5 text-xs font-bold text-ink"
          >
            Soạn mới
          </Link>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-stamp">{error}</p>}

      {/* Mode & Limit Controls */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stage-2 p-3">
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                mode === item.id ? "bg-paper text-ink" : "text-muted hover:text-white",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-muted mr-1">Số câu:</span>
          {[null, 5, 10, 15, 20, 30].map((count) => (
            <button
              key={count ?? "all"}
              type="button"
              onClick={() => setCustomCount(count)}
              className={cn(
                "rounded-lg px-2.5 py-1 font-bold transition",
                customCount === count ? "bg-gold text-gold-ink" : "bg-stage-soft text-muted hover:text-white",
              )}
            >
              {count === null ? "Tất cả" : count}
            </button>
          ))}
        </div>
      </div>

      {/* Category & Search */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {cats.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCat(item)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1 text-xs font-bold",
                cat === item ? "bg-stage-soft text-gold" : "text-muted hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Tìm tên đề..."
          className="w-full rounded-control bg-stage-2 px-3.5 py-2 text-sm text-white outline-none ring-1 ring-line focus:ring-gold sm:w-64"
        />
      </div>

      {/* Clean Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((quiz, idx) => (
          <article
            key={quiz.id}
            className={cn("sheet flex flex-col justify-between border-t-6 p-5", ACCENTS[idx % ACCENTS.length])}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-soft">
                <span className="text-stamp">{quiz.category}</span>
                <span>{DIFFICULTY_LABEL[quiz.difficulty]}</span>
              </div>
              <h2 className="mt-1.5 font-serif text-xl font-extrabold text-ink">{quiz.title}</h2>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-soft">{quiz.description}</p>
            </div>

            <div className="mt-4 border-t border-ink/10 pt-3">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold text-ink-soft">
                <span>{quiz.questions.length} câu</span>
                <span>Kỷ lục: {formatScore(bestScore(records, quiz.id, mode))}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => launch(quiz.id, mode, customCount ?? undefined)}
                  className="tile-btn kahoot-3 min-h-10 flex-1 rounded-lg px-3 text-xs font-extrabold text-white"
                >
                  Chơi {customCount && customCount < quiz.questions.length ? `(${customCount} câu)` : ""}
                </button>
                {!quiz.builtin && (
                  <>
                    <Link
                      to="/studio"
                      search={{ id: quiz.id }}
                      className="grid min-h-10 place-items-center rounded-lg bg-paper-2 px-3 text-xs font-bold text-ink"
                    >
                      Sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteQuiz(quiz.id)}
                      className="grid min-h-10 place-items-center rounded-lg bg-paper-2 px-3 text-xs font-bold text-stamp"
                    >
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {shown.length === 0 && <p className="mt-6 text-sm text-muted">Không có đề khớp.</p>}
    </Shell>
  );
}
