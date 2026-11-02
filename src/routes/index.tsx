import { Link, createFileRoute } from "@tanstack/react-router";
import { Flame, Heart, Infinity as InfinityIcon, Play, Sparkles, Timer, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { Shell, usePlayerRank } from "@/components/shell";
import { useLaunch } from "@/components/use-launch";
import { formatScore } from "@/game/engine";
import { BUILTINS } from "@/game/quizzes";
import { bestScore, useGame } from "@/game/store";
import { DIFFICULTY_LABEL, MODES, type Mode } from "@/game/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({ component: Home });

const MODE_VISUALS: Record<
  Mode,
  { icon: React.ReactNode; gradient: string; badge: string }
> = {
  classic: {
    icon: <Trophy className="size-6 text-yellow-300" />,
    gradient: "from-[#2582f7] to-[#1368ce]",
    badge: "Chuẩn Đề Thi",
  },
  time: {
    icon: <Timer className="size-6 text-orange-300" />,
    gradient: "from-[#ff3355] to-[#d81b60]",
    badge: "Tốc Độ Cao",
  },
  survival: {
    icon: <Heart className="size-6 text-rose-300 fill-rose-300" />,
    gradient: "from-[#32b814] to-[#1e7809]",
    badge: "3 Mạng Sống",
  },
  endless: {
    icon: <InfinityIcon className="size-6 text-amber-200" />,
    gradient: "from-[#ff9900] to-[#d87a00]",
    badge: "Combo Bất Tận",
  },
};

function Home() {
  const [mode, setMode] = useState<Mode>("classic");
  const [selectedQuizId, setSelectedQuizId] = useState<string>(BUILTINS[0]!.id);
  const [customCount, setCustomCount] = useState<number | null>(10);
  const records = useGame((s) => s.records);
  const launch = useLaunch();
  const rank = usePlayerRank();

  const featured = BUILTINS.find((q) => q.id === selectedQuizId) ?? BUILTINS[0]!;
  const modeMeta = MODES.find((item) => item.id === mode)!;
  const totalQ = featured.questions.length;
  const countOptions = [5, 10, 15, 20, 30, null];

  return (
    <Shell wide>
      {/* Top Player Banner */}
      <div className="glass-card mb-8 flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6">
        <div className="flex items-center gap-3.5">
          <div className="grid size-13 place-items-center rounded-2xl bg-gradient-to-br from-gold via-orange-400 to-stamp text-xl font-black text-ink shadow-lg">
            Lv.{rank.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gold">
                ★ {rank.badge}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white">
                {rank.gamesPlayed} ván đã đấu
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted">
              Tích lũy điểm nhịp để thăng cấp & phá đảo bảng vàng GDCD 9!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white/5 px-3.5 py-2 text-center">
            <p className="text-[11px] font-bold uppercase text-muted">Tổng Điểm XP</p>
            <p className="tabular text-lg font-black text-gold">{formatScore(rank.totalXP)}</p>
          </div>
          <div className="rounded-xl bg-white/5 px-3.5 py-2 text-center">
            <p className="text-[11px] font-bold uppercase text-muted">Chuỗi Cao Nhất</p>
            <p className="tabular flex items-center justify-center gap-1 text-lg font-black text-orange-400">
              <Flame className="size-4 fill-orange-400" /> {rank.bestStreak}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-3.5 py-2 text-center">
            <p className="text-[11px] font-bold uppercase text-muted">Câu Đúng</p>
            <p className="tabular text-lg font-black text-mint">{rank.totalCorrect}</p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left column: Hero + Mode Arena Cards */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-gold">
            <Sparkles className="size-3.5" /> Đấu trường trắc nghiệm tốc độ cao
          </div>
          <h1 className="mt-3 font-serif text-4xl font-black leading-[1.12] text-white sm:text-6xl">
            Bấm nhanh. Giữ chuỗi.
            <span className="mt-1 block bg-gradient-to-r from-[#ffc800] via-[#ff6b00] to-[#ff3355] bg-clip-text text-transparent">
              Chinh phục đỉnh cao!
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted">
            Trải nghiệm ôn tập GDCD 9 sôi động như <strong>Quizizz & Kahoot</strong>. Trả lời càng nhanh điểm càng nổ, tích lũy chuỗi Combo lửa và sử dụng Power-ups thông minh!
          </p>

          {/* 4 Colorful Game Modes */}
          <div className="mt-7">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted">
              1. Chọn chế độ thi đấu
            </p>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {MODES.map((item) => {
                const vis = MODE_VISUALS[item.id];
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={cn(
                      "btn-3d relative flex flex-col justify-between rounded-2xl p-4 text-left transition-all",
                      active
                        ? `bg-gradient-to-br ${vis.gradient} text-white ring-4 ring-white shadow-xl scale-[1.02]`
                        : "border border-white/10 bg-stage-2/85 text-paper hover:border-white/25 hover:bg-stage-soft/80",
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="grid size-11 place-items-center rounded-xl bg-black/25 shadow-inner">
                        {vis.icon}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider",
                          active ? "bg-black/25 text-white" : "bg-white/10 text-muted",
                        )}
                      >
                        {vis.badge}
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="block text-xl font-black">{item.name}</span>
                      <span className={cn("mt-1 block text-xs leading-relaxed", active ? "text-white/90" : "text-muted")}>
                        {item.blurb}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Deck Switcher */}
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-widest text-muted">
                2. Chọn bộ đề luyện tập
              </p>
              <Link to="/library" className="text-xs font-bold text-gold hover:underline">
                Xem tất cả đề →
              </Link>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {BUILTINS.slice(0, 4).map((q) => {
                const isSelected = q.id === featured.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setSelectedQuizId(q.id);
                      if (customCount && customCount > q.questions.length) {
                        setCustomCount(null);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition",
                      isSelected
                        ? "border-gold bg-gold/15 text-white shadow-md"
                        : "border-white/10 bg-stage-2/60 text-muted hover:border-white/20 hover:text-white",
                    )}
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-extrabold text-white">{q.title}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {q.questions.length} câu · {q.category}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full text-xs font-black",
                        isSelected ? "bg-gold text-ink" : "bg-white/10 text-muted",
                      )}
                    >
                      {isSelected ? "✓" : "→"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Main Launch Arena Card */}
        <article className="sheet relative overflow-hidden p-6 sm:p-8 border-4 border-gold/80">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stamp/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-stamp">
              <Zap className="size-3.5 fill-stamp" /> Sẵn sàng vào trận
            </span>
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold text-ink-soft">
              {DIFFICULTY_LABEL[featured.difficulty]}
            </span>
          </div>

          <h2 className="mt-4 font-serif text-3xl font-black leading-tight text-ink sm:text-4xl">
            {featured.title}
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{featured.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-lg bg-paper-2 px-3 py-1.5 text-xs font-extrabold text-ink">
              📚 Tổng {totalQ} câu hỏi
            </span>
            <span className="rounded-lg bg-paper-2 px-3 py-1.5 text-xs font-extrabold text-ink">
              🎯 Thang 10 điểm
            </span>
            <span className="rounded-lg bg-paper-2 px-3 py-1.5 text-xs font-extrabold text-ink">
              ⚡ Có trợ giúp 50/50
            </span>
          </div>

          {/* Question Amount Selector */}
          <div className="mt-6 rounded-2xl bg-paper-2 p-4 border border-ink/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-ink">
                🎚️ Tùy chỉnh số câu muốn làm:
              </label>
              <span className="text-xs font-bold text-stamp">
                {customCount === null ? `Làm hết (${totalQ} câu)` : `${customCount} câu ngẫu nhiên`}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {countOptions.map((count) => {
                if (count !== null && count >= totalQ) return null;
                const isSelected = customCount === count;
                const label = count === null ? `Tất cả (${totalQ})` : `${count} câu`;
                return (
                  <button
                    key={count ?? "all"}
                    type="button"
                    onClick={() => setCustomCount(count)}
                    className={cn(
                      "rounded-xl py-2 px-2 text-xs font-extrabold transition-all",
                      isSelected
                        ? "bg-gradient-to-r from-[#ff3355] to-[#ff6b00] text-white shadow-md scale-105"
                        : "bg-white text-ink hover:bg-ink/5 border border-ink/10",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Big Arcade Launch Button */}
          <button
            type="button"
            onClick={() => launch(featured.id, mode, customCount ?? undefined)}
            className="btn-3d mt-6 flex min-h-15 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#26890c] via-[#32b814] to-[#00c853] px-6 py-4 text-xl font-black tracking-wide text-white shadow-[0_6px_0_#175906,0_12px_25px_rgba(38,137,12,0.4)]"
          >
            <Play className="size-6 fill-white" />
            BẮT ĐẦU CHƠI · {customCount ? `${customCount} CÂU` : "TẤT CẢ"}
          </button>

          <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4 text-xs font-bold text-ink-soft">
            <span>Chế độ: {modeMeta.name}</span>
            <span className="text-ink">
              🏆 Kỷ lục: {formatScore(bestScore(records, featured.id, mode))} điểm
            </span>
          </div>
        </article>
      </div>
    </Shell>
  );
}
