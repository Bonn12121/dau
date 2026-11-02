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
        <h1 className="font-serif text-3xl">Chưa có ván nào</h1>
        <Link to="/" className="mt-4 inline-block text-gold font-semibold">
          Về bàn chơi
        </Link>
      </Shell>
    );
  }

  const mode = MODES.find((item) => item.id === record.mode);
  const answered = record.correct + record.wrong + record.polls;
  const pct = Math.round(record.accuracy * 100);
  const scaledTen = (record.accuracy * 10).toFixed(1);

  return (
    <Shell>
      <div className="sheet p-6 sm:p-8">
        <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
          <span>
            {mode?.name} · {record.quizTitle}
          </span>
          {record.newRecord && (
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-gold-ink">Kỷ lục mới</span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-extrabold text-ink sm:text-5xl">
              {scaledTen} <span className="text-2xl text-ink-soft">/ 10 điểm</span>
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{summaryLine(record.accuracy)}</p>
          </div>
          <div className="text-right">
            <span className="block text-xs font-bold uppercase text-ink-soft">Tổng điểm nhịp</span>
            <span className="tabular font-serif text-3xl font-extrabold text-stamp">
              {formatScore(record.score)}
            </span>
          </div>
        </div>

        {/* Accuracy Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-bold text-ink-soft">
            <span className="text-[#26890c]">Đúng {record.correct}</span>
            <span>Chính xác {pct}%</span>
            <span className="text-[#e21b3c]">Sai {record.wrong}</span>
          </div>
          <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-[#e21b3c]/25">
            <div className="h-full bg-[#26890c]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Stats Grid */}
        <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="Chuỗi dài nhất" value={`${record.bestStreak}x`} />
          <Stat label="Thời gian" value={formatClock(record.duration / 1000)} />
          <Stat label="TB mỗi câu" value={`${record.avgTime.toFixed(1)}s`} />
          <Stat
            label={record.mode === "classic" && record.examMax > 0 ? "Điểm trọng số" : "Số câu đã làm"}
            value={
              record.mode === "classic" && record.examMax > 0
                ? `${formatExam(record.exam)}/${formatExam(record.examMax)}`
                : `${answered} câu`
            }
          />
        </dl>

        {/* Actions */}
        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => launch(record.quizId, record.mode, record.questionLimit)}
            className="tile-btn kahoot-3 min-h-12 rounded-xl font-bold text-white"
          >
            Chơi lại
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="min-h-12 rounded-xl bg-paper-2 font-bold text-ink hover:bg-ink/10"
          >
            {open ? "Ẩn đáp án" : `Xem lại (${record.logs.length} câu)`}
          </button>
          <Link
            to="/"
            className="grid min-h-12 place-items-center rounded-xl bg-ink font-bold text-white"
          >
            Về trang chủ
          </Link>
        </div>
      </div>

      {open && (
        <ol className="mt-6 grid gap-3">
          {record.logs.map((log, index) => {
            const isCorrect = log.outcome === "correct";
            return (
              <li
                key={`${log.questionId}-${index}`}
                className={cn(
                  "sheet p-4 border-l-6",
                  isCorrect ? "border-l-[#26890c]" : "border-l-[#e21b3c]",
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span className={isCorrect ? "text-[#26890c]" : "text-[#e21b3c]"}>
                    {log.kicker ?? `Câu ${index + 1}`} · {isCorrect ? "Đúng" : "Sai"}
                  </span>
                  <span className="tabular text-ink-soft">+{formatScore(log.gained)}</span>
                </div>
                <p className="mt-1.5 font-serif text-base font-bold text-ink whitespace-pre-line">
                  {log.prompt}
                </p>
                <p className="mt-2 text-sm text-ink-soft">Bạn chọn: {log.given}</p>
                {!isCorrect && log.outcome !== "neutral" && (
                  <p className="mt-0.5 text-sm font-bold text-[#26890c]">Đáp án đúng: {log.answer}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper-2 p-3">
      <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
      <dd className="tabular mt-1 font-serif text-xl font-extrabold text-ink">{value}</dd>
    </div>
  );
}
