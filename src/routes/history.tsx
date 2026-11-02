import { createFileRoute } from "@tanstack/react-router";
import { Flame, RotateCcw, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { useLaunch } from "@/components/use-launch";
import { formatExam, formatScore } from "@/game/engine";
import { useGame } from "@/game/store";
import { MODES } from "@/game/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const records = useGame((s) => s.records);
  const clearHistory = useGame((s) => s.clearHistory);
  const launch = useLaunch();
  const [ask, setAsk] = useState(false);

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-gold">
            <Trophy className="size-3.5" /> Bảng Vàng Thành Tích
          </span>
          <h1 className="mt-2 font-serif text-4xl font-black text-white sm:text-5xl">
            Lịch sử đấu trường
          </h1>
        </div>
        {records.length > 0 &&
          (ask ? (
            <button
              type="button"
              className="rounded-xl bg-stamp px-4 py-2 text-xs font-extrabold text-white"
              onClick={clearHistory}
            >
              Xác nhận xóa tất cả
            </button>
          ) : (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-muted hover:text-white"
              onClick={() => setAsk(true)}
            >
              <Trash2 className="size-3.5" /> Xóa lịch sử
            </button>
          ))}
      </div>

      {records.length === 0 && (
        <div className="glass-card mt-8 p-10 text-center">
          <p className="text-lg font-bold text-muted">Chưa có ván đấu nào được ghi nhận. Hãy vào Sảnh Chơi để mở màn!</p>
        </div>
      )}

      <ul className="mt-6 grid gap-3.5">
        {records.map((record) => {
          const mode = MODES.find((item) => item.id === record.mode);
          const pct = Math.round(record.accuracy * 100);
          return (
            <li
              key={record.id}
              className="sheet flex flex-wrap items-center justify-between gap-4 p-5 border-l-8 border-l-gold"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-white">
                    {mode?.name}
                  </span>
                  {record.newRecord && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800">
                      🏆 Kỷ lục mới
                    </span>
                  )}
                  <span className="text-xs font-semibold text-ink-soft">
                    {new Date(record.at).toLocaleString("vi-VN")}
                  </span>
                </div>

                <p className="mt-1.5 font-serif text-xl font-black text-ink">
                  {record.quizTitle}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-ink-soft">
                  <span className={cn("rounded-md px-2 py-0.5 font-extrabold", pct >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-paper-2 text-ink")}>
                    🎯 Chính xác: {pct}% ({record.correct}/{record.correct + record.wrong})
                  </span>
                  <span className="flex items-center gap-1 text-orange-600">
                    <Flame className="size-3.5 fill-orange-500" /> Chuỗi {record.bestStreak}x
                  </span>
                  {record.mode === "classic" && record.examMax > 0 && (
                    <span>
                      📝 Điểm đề: {formatExam(record.exam)}/{formatExam(record.examMax)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase text-ink-soft">Điểm nhịp</span>
                  <span className="tabular font-serif text-2xl font-black text-stamp">
                    {formatScore(record.score)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => launch(record.quizId, record.mode, record.questionLimit)}
                  className="btn-3d kahoot-1 flex size-11 items-center justify-center rounded-xl text-white"
                  title="Phục thù / Chơi lại"
                >
                  <RotateCcw className="size-5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
