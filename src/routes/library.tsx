import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { useLaunch } from "@/components/use-launch";
import { formatScore } from "@/game/engine";
import { allQuizzes } from "@/game/quizzes";
import { parseBundle } from "@/game/schema";
import { bestScore, useGame } from "@/game/store";
import { DIFFICULTY_LABEL, MODES, type Mode } from "@/game/types";

export const Route = createFileRoute("/library")({ component: Library });

function Library() {
  const custom = useGame((s) => s.custom);
  const records = useGame((s) => s.records);
  const importQuizzes = useGame((s) => s.importQuizzes);
  const deleteQuiz = useGame((s) => s.deleteQuiz);
  const launch = useLaunch();
  const [mode, setMode] = useState<Mode>("classic");
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

  return (
    <Shell wide>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Tủ đề</p>
          <h1 className="font-serif text-5xl">Chọn một đề</h1>
        </div>
        <div className="flex gap-2">
          <label className="grid min-h-11 cursor-pointer place-items-center rounded-control bg-stage-soft px-4 text-sm">
            Nhập
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
          <Link to="/studio" search={{ id: "" }} className="grid min-h-11 place-items-center rounded-control bg-paper px-4 text-sm font-semibold text-ink">
            Soạn mới
          </Link>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-stamp">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={mode === item.id ? "rounded-control bg-paper px-3 py-2 text-sm text-ink" : "rounded-control bg-stage-soft px-3 py-2 text-sm text-muted"}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {cats.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCat(item)}
            className={cat === item ? "shrink-0 text-sm text-gold" : "shrink-0 text-sm text-muted"}
          >
            {item}
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Tìm đề"
        className="mt-4 w-full rounded-control bg-stage-soft px-4 py-3 text-paper outline-none ring-1 ring-line"
      />
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {shown.map((quiz) => (
          <li key={quiz.id} className="flex flex-wrap items-center gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-widest text-stamp">{quiz.category}</p>
              <p className="font-serif text-2xl">{quiz.title}</p>
              <p className="text-sm text-muted">
                {quiz.questions.length} câu · {DIFFICULTY_LABEL[quiz.difficulty]} · kỷ lục {formatScore(bestScore(records, quiz.id, mode))}
              </p>
            </div>
            <button type="button" onClick={() => launch(quiz.id, mode)} className="min-h-11 rounded-control bg-paper px-4 text-sm font-semibold text-ink">
              Chơi
            </button>
            {!quiz.builtin && (
              <>
                <Link to="/studio" search={{ id: quiz.id }} className="min-h-11 px-2 text-sm text-gold">
                  Sửa
                </Link>
                <button type="button" onClick={() => deleteQuiz(quiz.id)} className="min-h-11 px-2 text-sm text-stamp">
                  Xóa
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="mt-6 text-muted">Không có đề khớp.</p>}
    </Shell>
  );
}
