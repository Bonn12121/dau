import { Link, createFileRoute } from "@tanstack/react-router";
import { Award, CheckCircle2, Flame, Home, RotateCcw, Sparkles, Timer, Trophy, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { useLaunch } from "@/components/use-launch";
import { formatClock, formatExam, formatScore, summaryLine } from "@/game/engine";
import { MODES } from "@/game/types";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/results")({ component: Results });

function getRankTier(accuracy: number) {
  if (accuracy >= 0.95) return { tier: "S+", title: "Huyền Thoại Bất Bại!", color: "from-yellow-300 via-amber-400 to-orange-500" };
  if (accuracy >= 0.85) return { tier: "S", title: "Bậc Thầy Kiến Thức!", color: "from-emerald-300 to-green-500" };
  if (accuracy >= 0.7) return { tier: "A", title: "Chiến Binh Xuất Sắc!", color: "from-cyan-300 to-blue-500" };
  if (accuracy >= 0.5) return { tier: "B", title: "Khởi Đầu Vững Chắc!", color: "from-purple-300 to-indigo-500" };
  return { tier: "C", title: "Cố Gắng Lần Sau Nhé!", color: "from-rose-400 to-red-500" };
}

function Results() {
  const record = useGame((s) => s.lastRun);
  const launch = useLaunch();
  const [open, setOpen] = useState(true);

  if (!record) {
    return (
      <Shell>
        <div className="glass-card p-8 text-center">
          <h1 className="font-serif text-4xl font-black">Chưa có ván đấu nào</h1>
          <Link to="/" className="btn-3d mt-5 inline-flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 font-extrabold text-ink">
            Về sảnh thi đấu
          </Link>
        </div>
      </Shell>
    );
  }

  const mode = MODES.find((item) => item.id === record.mode);
  const answered = record.correct + record.wrong + record.polls;
  const rank = getRankTier(record.accuracy);
  const scaledTen = (record.accuracy * 10).toFixed(1);

  return (
    <Shell>
      {/* Podium Celebration Card */}
      <div className="glass-card relative overflow-hidden p-6 sm:p-10 text-center border-2 border-gold/40">
        {record.newRecord && (
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold to-orange-500 px-4 py-1 text-xs font-black uppercase tracking-widest text-ink shadow-lg">
            <Trophy className="size-4 fill-ink" /> Kỷ Lục Mới Của Bạn!
          </div>
        )}

        <p className="text-xs font-extrabold uppercase tracking-widest text-muted">
          {mode?.name} · {record.quizTitle}
        </p>

        {/* Big Rank Badge */}
        <div className="mt-5 flex flex-col items-center justify-center">
          <div
            className={cn(
              "pop grid size-24 place-items-center rounded-3xl bg-gradient-to-br text-5xl font-black text-ink shadow-[0_10px_35px_rgba(255,200,0,0.4)] ring-4 ring-white",
              rank.color,
            )}
          >
            {rank.tier}
          </div>
          <h1 className="mt-4 font-serif text-3xl font-black text-white sm:text-5xl">
            {rank.title}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">{summaryLine(record.accuracy)}</p>
        </div>

        {/* Score & Exam Score Display */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gold">⚡ Tổng điểm Arcade</span>
            <p className="tabular mt-1 font-serif text-4xl font-black text-white">
              {formatScore(record.score)}
            </p>
          </div>

          <div className="rounded-2xl border border-mint/30 bg-mint/10 p-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-mint">🎯 Điểm quy đổi hệ 10</span>
            <p className="tabular mt-1 font-serif text-4xl font-black text-white">
              {scaledTen} <span className="text-xl text-muted">/ 10</span>
            </p>
            {record.mode === "classic" && record.examMax > 0 && (
              <p className="mt-0.5 text-xs text-muted">
                Điểm trọng số: {formatExam(record.exam)} / {formatExam(record.examMax)}
              </p>
            )}
          </div>
        </div>

        {/* Accuracy Visual Bar */}
        <div className="mt-6 rounded-2xl bg-stage/80 p-4 text-left border border-white/10">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase">
            <span className="text-mint">✓ Đúng {record.correct} câu</span>
            <span className="text-white">Độ chính xác: {Math.round(record.accuracy * 100)}%</span>
            <span className="text-stamp">✕ Sai {record.wrong} câu</span>
          </div>
          <div className="mt-2 flex h-3.5 w-full overflow-hidden rounded-full bg-stamp/40">
            <div
              className="h-full bg-gradient-to-r from-mint to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.round(record.accuracy * 100)}%` }}
            />
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat icon={<Flame className="size-4 text-orange-400" />} label="Chuỗi Combo" value={`${record.bestStreak}x`} />
          <Stat icon={<Timer className="size-4 text-cyan-400" />} label="Tổng thời gian" value={formatClock(record.duration / 1000)} />
          <Stat icon={<Zap className="size-4 text-gold" />} label="Tốc độ TB" value={`${record.avgTime.toFixed(1)}s/câu`} />
          <Stat icon={<Award className="size-4 text-purple-400" />} label="Đã hoàn thành" value={`${answered} câu`} />
        </dl>

        {/* Action Buttons */}
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => launch(record.quizId, record.mode, record.questionLimit)}
            className="btn-3d kahoot-3 flex min-h-13 items-center justify-center gap-2 rounded-2xl px-4 font-black text-white"
          >
            <RotateCcw className="size-5" />
            <span>CHƠI LẠI</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="btn-3d kahoot-1 flex min-h-13 items-center justify-center gap-2 rounded-2xl px-4 font-black text-white"
          >
            <Sparkles className="size-5" />
            <span>{open ? "ẨN ĐÁP ÁN" : "XEM ĐÁP ÁN"}</span>
          </button>
          <Link
            to="/"
            className="btn-3d flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-white px-4 font-black text-ink"
          >
            <Home className="size-5" />
            <span>VỀ SẢNH</span>
          </Link>
        </div>
      </div>

      {/* Detailed Question Review List */}
      {open && (
        <div className="mt-8">
          <h2 className="mb-4 font-serif text-2xl font-black text-white">
            📋 Chi tiết đáp án ({record.logs.length} câu)
          </h2>
          <ol className="grid gap-3.5">
            {record.logs.map((log, index) => {
              const isCorrect = log.outcome === "correct";
              return (
                <li
                  key={`${log.questionId}-${index}`}
                  className={cn(
                    "sheet p-5 border-l-8",
                    isCorrect ? "border-l-[#00c853]" : "border-l-[#ff1744]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-extrabold uppercase",
                        isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
                      )}
                    >
                      {isCorrect ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                      {log.kicker ?? `Câu ${index + 1}`} · {isCorrect ? "Chính xác" : "Chưa đúng"}
                    </span>
                    <span className="tabular text-xs font-bold text-ink-soft">
                      +{formatScore(log.gained)} điểm · {log.elapsed.toFixed(1)}s
                    </span>
                  </div>

                  <p className="mt-2.5 font-serif text-lg font-extrabold text-ink whitespace-pre-line">
                    {log.prompt}
                  </p>
                  <div className="mt-3 grid gap-1 rounded-xl bg-paper-2 p-3 text-sm">
                    <p className={cn("font-semibold", isCorrect ? "text-emerald-700" : "text-rose-600")}>
                      • Bạn chọn: {log.given}
                    </p>
                    {!isCorrect && log.outcome !== "neutral" && (
                      <p className="font-extrabold text-emerald-800">✓ Đáp án đúng: {log.answer}</p>
                    )}
                    {log.explanation && (
                      <p className="mt-1 border-t border-ink/10 pt-1.5 text-ink-soft">
                        💡 {log.explanation}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Shell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-stage-2/90 p-3.5 text-left">
      <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
        {icon}
        <span>{label}</span>
      </dt>
      <dd className="tabular mt-1.5 font-serif text-2xl font-black text-white">{value}</dd>
    </div>
  );
}
