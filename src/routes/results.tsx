import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { useLaunch } from "@/components/use-launch";
import { formatClock, formatExam, formatScore, summaryLine } from "@/game/engine";
import { MODES } from "@/game/types";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/results")({ component: Results });

function Results() {
  const record = useGame((s) => s.lastRun);
  const launch = useLaunch();
  const [open, setOpen] = useState(false);
  if (!record) {
    return (
      <Shell>
        <h1 className="font-serif text-4xl">Chưa có ván nào</h1>
        <Link to="/" className="mt-4 inline-block text-gold">
          Về bàn chơi
        </Link>
      </Shell>
    );
  }
  const mode = MODES.find((item) => item.id === record.mode);
  const answered = record.correct + record.wrong + record.polls;
  return (
    <Shell>
      <p className="text-xs uppercase tracking-widest text-muted">{mode?.name} · {record.quizTitle}</p>
      <h1 className="mt-2 font-serif text-5xl">{record.newRecord ? "Kỷ lục mới" : "Hết ván"}</h1>
      <p className="mt-3 text-muted">{summaryLine(record.accuracy)}</p>
      {record.mode === "classic" && record.examMax > 0 && (
        <p className="mt-6 font-serif text-6xl text-gold">
          {formatExam(record.exam)}
          <span className="text-2xl text-muted"> / {formatExam(record.examMax)}</span>
        </p>
      )}
      <p className={cn("tabular font-serif text-5xl", record.mode === "classic" && record.examMax > 0 ? "mt-2 text-3xl text-paper" : "mt-6 text-gold")}>
        {formatScore(record.score)} điểm nhịp
      </p>
      {!record.finishedAll && record.mode === "classic" && (
        <p className="mt-2 text-sm text-muted">Ván dừng trước khi hết đề. Điểm đề tính trên cả bài.</p>
      )}
      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-sheet bg-line sm:grid-cols-4">
        <Stat label="Đúng" value={String(record.correct)} />
        <Stat label="Sai" value={String(record.wrong)} />
        <Stat label="Chính xác" value={`${Math.round(record.accuracy * 100)}%`} />
        <Stat label="Chuỗi" value={String(record.bestStreak)} />
        <Stat label="Thời gian" value={formatClock(record.duration / 1000)} />
        <Stat label="TB mỗi câu" value={`${record.avgTime.toFixed(1)}s`} />
        <Stat label="Đã trả lời" value={String(answered)} />
        <Stat label="Thăm dò" value={String(record.polls)} />
      </dl>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => launch(record.quizId, record.mode)} className="min-h-12 rounded-control bg-paper font-semibold text-ink">
          Chơi lại
        </button>
        <button type="button" onClick={() => setOpen((value) => !value)} className="min-h-12 rounded-control bg-stage-soft font-semibold">
          {open ? "Ẩn đáp án" : "Xem lại"}
        </button>
        <Link to="/" className="grid min-h-12 place-items-center rounded-control bg-stage-soft font-semibold">
          Về nhà
        </Link>
      </div>
      {open && (
        <ol className="mt-6 grid gap-3">
          {record.logs.map((log, index) => (
            <li key={`${log.questionId}-${index}`} className="sheet p-4">
              <p className="text-xs uppercase tracking-widest text-stamp">
                {log.kicker ?? `Câu ${index + 1}`} · {log.outcome === "correct" ? "Đúng" : log.outcome === "neutral" ? "Đã ghi" : "Sai"}
              </p>
              <p className="mt-2 font-serif text-xl">{log.prompt}</p>
              <p className="mt-2 text-sm text-ink-soft">Bạn chọn: {log.given}</p>
              {log.outcome !== "neutral" && <p className="text-sm">Đáp án: {log.answer}</p>}
              {log.explanation && <p className="mt-2 text-sm text-ink-soft">{log.explanation}</p>}
            </li>
          ))}
        </ol>
      )}
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stage-2 p-4">
      <dt className="text-xs uppercase tracking-widest text-muted">{label}</dt>
      <dd className="tabular mt-1 font-serif text-2xl">{value}</dd>
    </div>
  );
}
