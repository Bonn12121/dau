import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { formatExam, formatScore } from "@/game/engine";
import { useGame } from "@/game/store";
import { MODES } from "@/game/types";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const records = useGame((s) => s.records);
  const clearHistory = useGame((s) => s.clearHistory);
  const [ask, setAsk] = useState(false);
  return (
    <Shell>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Trên máy này</p>
          <h1 className="font-serif text-5xl">Ván đã chơi</h1>
        </div>
        {records.length > 0 &&
          (ask ? (
            <button type="button" className="text-sm text-stamp" onClick={clearHistory}>
              Xóa hết
            </button>
          ) : (
            <button type="button" className="text-sm text-muted" onClick={() => setAsk(true)}>
              Xóa lịch sử
            </button>
          ))}
      </div>
      {records.length === 0 && <p className="mt-8 text-muted">Chưa có ván nào được lưu.</p>}
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {records.map((record) => {
          const mode = MODES.find((item) => item.id === record.mode);
          return (
            <li key={record.id} className="py-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-serif text-2xl">{record.quizTitle}</p>
                <p className="tabular text-gold">{formatScore(record.score)}</p>
              </div>
              <p className="text-sm text-muted">
                {mode?.name} · {Math.round(record.accuracy * 100)}% · chuỗi {record.bestStreak}
                {record.mode === "classic" && record.examMax > 0 ? ` · điểm đề ${formatExam(record.exam)}/${formatExam(record.examMax)}` : ""}
                {record.newRecord ? " · kỷ lục" : ""}
              </p>
              <p className="text-xs text-muted">{new Date(record.at).toLocaleString("vi-VN")}</p>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
