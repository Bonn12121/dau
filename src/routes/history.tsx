import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { useLaunch } from "@/components/use-launch";
import { formatExam, formatScore } from "@/game/engine";
import { useGame } from "@/game/store";
import { MODES } from "@/game/types";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const records = useGame((s) => s.records);
  const clearHistory = useGame((s) => s.clearHistory);
  const launch = useLaunch();
  const [ask, setAsk] = useState(false);

  return (
    <Shell>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Trên máy này</p>
          <h1 className="font-serif text-4xl font-extrabold text-white">Lịch sử chơi</h1>
        </div>
        {records.length > 0 &&
          (ask ? (
            <button type="button" className="text-xs font-bold text-stamp" onClick={clearHistory}>
              Xác nhận xóa hết
            </button>
          ) : (
            <button type="button" className="text-xs font-semibold text-muted hover:text-white" onClick={() => setAsk(true)}>
              Xóa lịch sử
            </button>
          ))}
      </div>

      {records.length === 0 && <p className="mt-8 text-sm text-muted">Chưa có ván nào được lưu.</p>}

      <ul className="mt-5 grid gap-3">
        {records.map((record) => {
          const mode = MODES.find((item) => item.id === record.mode);
          const pct = Math.round(record.accuracy * 100);
          return (
            <li
              key={record.id}
              className="sheet flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
                  <span className="text-stamp">{mode?.name}</span>
                  <span>·</span>
                  <span>{new Date(record.at).toLocaleString("vi-VN")}</span>
                  {record.newRecord && <span className="rounded bg-gold px-1.5 py-0.5 text-[10px] text-gold-ink">Kỷ lục</span>}
                </div>
                <p className="mt-1 font-serif text-lg font-extrabold text-ink">{record.quizTitle}</p>
                <p className="mt-0.5 text-xs font-semibold text-ink-soft">
                  Đúng {pct}% ({record.correct}/{record.correct + record.wrong}) · Chuỗi {record.bestStreak}x
                  {record.mode === "classic" && record.examMax > 0
                    ? ` · Điểm đề ${formatExam(record.exam)}/${formatExam(record.examMax)}`
                    : ""}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="tabular font-serif text-xl font-extrabold text-ink">
                  {formatScore(record.score)}
                </span>
                <button
                  type="button"
                  onClick={() => launch(record.quizId, record.mode, record.questionLimit)}
                  className="rounded-lg bg-paper-2 px-3 py-2 text-xs font-bold text-ink hover:bg-ink hover:text-white transition"
                >
                  Chơi lại
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
