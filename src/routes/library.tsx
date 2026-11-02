import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, Edit3, Play, Plus, Search, Trash2, Trophy, Upload } from "lucide-react";
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

  const CARD_COLORS = [
    "from-[#ff3355] to-[#d81b60]",
    "from-[#2582f7] to-[#1368ce]",
    "from-[#32b814] to-[#1e7809]",
    "from-[#ff9900] to-[#d87a00]",
  ];

  return (
    <Shell wide>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-gold">
            <BookOpen className="size-3.5" /> Kho Đề Đấu Trường
          </span>
          <h1 className="mt-2 font-serif text-4xl font-black text-white sm:text-5xl">
            Khám phá & Thử sức
          </h1>
        </div>
        <div className="flex gap-2.5">
          <label className="btn-3d flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-stage-soft px-4 text-sm font-bold text-white">
            <Upload className="size-4" />
            <span>Nhập JSON</span>
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
                  setError("Tệp không phải JSON hợp lệ.");
                }
              }}
            />
          </label>
          <Link
            to="/studio"
            search={{ id: "" }}
            className="btn-3d flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3355] to-[#ff6b00] px-4 text-sm font-extrabold text-white shadow-lg"
          >
            <Plus className="size-4" />
            <span>Soạn đề mới</span>
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-stamp/20 px-4 py-2 text-sm font-bold text-stamp">
          ⚠️ {error}
        </p>
      )}

      {/* Control Bar: Mode & Question Limit */}
      <div className="glass-card mt-6 flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted mr-1">Chế độ:</span>
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                mode === item.id
                  ? "bg-white text-ink shadow-md scale-105"
                  : "bg-white/5 text-muted hover:bg-white/10 hover:text-white",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-extrabold uppercase tracking-wider text-muted mr-1">Số câu:</span>
          {[null, 5, 10, 15, 20, 30].map((count) => (
            <button
              key={count ?? "all"}
              type="button"
              onClick={() => setCustomCount(count)}
              className={cn(
                "rounded-xl px-3 py-1.5 font-extrabold transition-colors",
                customCount === count
                  ? "bg-gold text-ink shadow-sm scale-105"
                  : "bg-white/5 text-muted hover:bg-white/10 hover:text-white",
              )}
            >
              {count === null ? "Tất cả" : `${count} câu`}
            </button>
          ))}
        </div>
      </div>

      {/* Category & Search */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cats.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCat(item)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold transition",
                cat === item
                  ? "bg-gradient-to-r from-gold to-amber-500 text-ink shadow-sm"
                  : "bg-stage-2 text-muted hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="relative min-w-64 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Tìm tên bộ đề..."
            className="w-full rounded-xl border border-white/15 bg-stage-2 pl-10 pr-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* Quiz Grid (Quizizz Card Style) */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((quiz, idx) => {
          const bannerGrad = CARD_COLORS[idx % CARD_COLORS.length];
          const recordScore = bestScore(records, quiz.id, mode);
          return (
            <article
              key={quiz.id}
              className="sheet flex flex-col justify-between overflow-hidden transition-transform hover:-translate-y-1"
            >
              <div>
                <div className={cn("bg-gradient-to-r p-4 text-white", bannerGrad)}>
                  <div className="flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wider">
                    <span className="rounded-full bg-black/25 px-2.5 py-0.5">{quiz.category}</span>
                    <span>{DIFFICULTY_LABEL[quiz.difficulty]}</span>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl font-black leading-snug">
                    {quiz.title}
                  </h2>
                </div>

                <div className="p-5">
                  <p className="line-clamp-2 text-sm text-ink-soft">{quiz.description}</p>
                  <div className="mt-4 flex items-center justify-between text-xs font-extrabold text-ink">
                    <span className="rounded-lg bg-paper-2 px-2.5 py-1">
                      📋 {quiz.questions.length} câu hỏi
                    </span>
                    <span className="flex items-center gap-1 text-amber-700">
                      <Trophy className="size-3.5" /> Kỷ lục: {formatScore(recordScore)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-ink/10 bg-paper-2/60 p-4">
                <button
                  type="button"
                  onClick={() => launch(quiz.id, mode, customCount ?? undefined)}
                  className="btn-3d kahoot-3 flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white"
                >
                  <Play className="size-4 fill-white" />
                  <span>CHƠI NGAY {customCount && customCount < quiz.questions.length ? `(${customCount} CÂU)` : ""}</span>
                </button>
                {!quiz.builtin && (
                  <>
                    <Link
                      to="/studio"
                      search={{ id: quiz.id }}
                      className="grid size-11 place-items-center rounded-xl bg-white text-ink hover:bg-ink/10 border border-ink/10"
                      title="Chỉnh sửa"
                    >
                      <Edit3 className="size-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteQuiz(quiz.id)}
                      className="grid size-11 place-items-center rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200"
                      title="Xóa đề"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {shown.length === 0 && (
        <div className="glass-card mt-8 p-10 text-center">
          <p className="text-lg font-bold text-muted">Không tìm thấy bộ đề nào khớp với từ khóa.</p>
        </div>
      )}
    </Shell>
  );
}
