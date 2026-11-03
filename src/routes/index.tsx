import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DauIcon } from "@/components/marks";
import { NamePromptModal } from "@/components/name-prompt-modal";
import { Shell } from "@/components/shell";
import { useLaunch } from "@/components/use-launch";
import { formatScore } from "@/game/engine";
import { BUILTINS } from "@/game/quizzes";
import { bestScore, useGame } from "@/game/store";
import { DIFFICULTY_LABEL, MODES, type Mode } from "@/game/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({ component: Home });

const MODE_COLORS: Record<Mode, string> = {
  classic: "bg-[#1368ce]",
  time: "bg-[#e21b3c]",
  survival: "bg-[#26890c]",
  endless: "bg-[#d89e00]",
  admin: "bg-[#8b5cf6]",
};

function Home() {
  const [mode, setMode] = useState<Mode>("classic");
  const [selectedQuizId, setSelectedQuizId] = useState<string>(BUILTINS[0]!.id);
  const [customCount, setCustomCount] = useState<number | null>(10);
  const [showNameModal, setShowNameModal] = useState(false);
  const records = useGame((s) => s.records);
  const launch = useLaunch();

  const featured = BUILTINS.find((q) => q.id === selectedQuizId) ?? BUILTINS[0]!;
  const modeMeta = MODES.find((item) => item.id === mode)!;
  const totalQ = featured.questions.length;
  const countOptions = [5, 10, 15, 20, 30, null];

  function handleStart() {
    setShowNameModal(true);
  }

  function handleConfirmName() {
    setShowNameModal(false);
    launch(featured.id, mode, customCount ?? undefined);
  }

  return (
    <Shell wide>
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left: Mode Selection & Quiz Switcher */}
        <div>
          <h1 className="fade-up font-serif text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Chọn nhịp.
            <span className="block text-gold">Vào ván ngay.</span>
          </h1>
          <p className="mt-2.5 max-w-lg text-sm text-muted">
            Trắc nghiệm tốc độ cao. Trả lời đúng tự động chuyển câu liền mạch, điểm nhân theo chuỗi liên tiếp.
          </p>

          {/* 4 Game Modes */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {MODES.map((item) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={cn(
                    "hover-lift fade-up flex items-start gap-3.5 rounded-xl p-4 text-left",
                    active
                      ? "bg-stage-soft text-white ring-2 ring-gold"
                      : "bg-stage-2 text-muted hover:bg-stage-soft/70 hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-lg text-white",
                      MODE_COLORS[item.id],
                    )}
                  >
                    <DauIcon name={item.id} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-base font-bold text-white">{item.name}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{item.blurb}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Quiz Picker */}
          <div className="mt-6">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Bộ đề có sẵn</span>
              <Link to="/library" className="text-xs font-semibold text-gold hover:underline">
                Mở tủ đề →
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
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
                      "flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left transition",
                      isSelected
                        ? "bg-paper text-ink font-semibold"
                        : "bg-stage-2 text-muted hover:bg-stage-soft hover:text-white",
                    )}
                  >
                    <span className="truncate text-sm font-bold">{q.title}</span>
                    <span className="shrink-0 text-xs opacity-75">{q.questions.length} câu</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Launch Card */}
        <article className="sheet fade-up p-6 sm:p-7" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
            <span className="text-stamp">{featured.category}</span>
            <span>{DIFFICULTY_LABEL[featured.difficulty]}</span>
          </div>

          <h2 className="mt-2 font-serif text-3xl font-extrabold leading-snug text-ink">
            {featured.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{featured.description}</p>

          {/* Question Amount Selector */}
          <div className="mt-5 rounded-xl bg-paper-2 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-ink-soft">
              <span>Số lượng câu hỏi</span>
              <span className="text-ink">{customCount === null ? `Tất cả (${totalQ})` : `${customCount} câu`}</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {countOptions.map((count) => {
                if (count !== null && count >= totalQ) return null;
                const isSelected = customCount === count;
                return (
                  <button
                    key={count ?? "all"}
                    type="button"
                    onClick={() => setCustomCount(count)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                      isSelected
                        ? "bg-ink text-white"
                        : "bg-white text-ink hover:bg-ink/10",
                    )}
                  >
                    {count === null ? `Tất cả (${totalQ})` : `${count} câu`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleStart}
            className="tile-btn kahoot-3 mt-5 flex min-h-13 w-full items-center justify-center rounded-xl px-5 py-3.5 text-lg font-extrabold text-white"
          >
            Bắt đầu · {modeMeta.name} {customCount ? `(${customCount} câu)` : ""}
          </button>

          <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-xs font-semibold text-ink-soft">
            <span>Tổng {totalQ} câu trong đề</span>
            <span>Kỷ lục: {formatScore(bestScore(records, featured.id, mode))}</span>
          </div>
        </article>
      </div>

      <NamePromptModal
        open={showNameModal}
        quizId={featured.id}
        onConfirm={handleConfirmName}
        onCancel={() => setShowNameModal(false)}
      />
    </Shell>
  );
}
