import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Flame, Heart, Lightbulb, Scissors, Snowflake, Sparkles, Timer, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { QuestionBoard } from "@/components/question-board";
import { Shell } from "@/components/shell";
import { formatClock, formatScore } from "@/game/engine";
import { findQuiz } from "@/game/quizzes";
import { sfx } from "@/game/sound";
import { currentQuestion, useGame } from "@/game/store";
import { MODES, type Mode } from "@/game/types";
import { cn } from "@/lib/cn";

function isMode(value: unknown): value is Mode {
  return value === "classic" || value === "time" || value === "survival" || value === "endless";
}

const PRAISE_CORRECT = [
  "🔥 Quá đỉnh! Chuẩn không cần chỉnh!",
  "⚡ Tốc độ ánh sáng! Tuyệt vời!",
  "🎯 Bách phát bách trúng!",
  "🌟 Xuất sắc! Giữ vững phong độ nhé!",
  "🚀 Đỉnh của chóp!",
];

const PRAISE_WRONG = [
  "💪 Không sao! Đọc giải thích để nhớ kỹ hơn nhé!",
  "⚡ Suýt trúng rồi, cố lên ở câu tiếp theo!",
  "🌱 Sai một lần để nhớ mãi mãi!",
];

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>): { quiz: string; mode: Mode; limit?: number } => ({
    quiz: typeof search.quiz === "string" ? search.quiz : "gdcd-ngan-hang-full",
    mode: isMode(search.mode) ? search.mode : "classic",
    ...(typeof search.limit === "number" ? { limit: search.limit } : {}),
  }),
  component: PlayScreen,
});

function useNow(active: boolean) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const loop = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return now;
}

function PlayScreen() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const hydrated = useGame((s) => s.hydrated);
  const custom = useGame((s) => s.custom);
  const session = useGame((s) => s.session);
  const startRun = useGame((s) => s.startRun);
  const tickCountdown = useGame((s) => s.tickCountdown);
  const submit = useGame((s) => s.submit);
  const continueRun = useGame((s) => s.continueRun);
  const revealHint = useGame((s) => s.revealHint);
  const quit = useGame((s) => s.quit);

  const [stopAsk, setStopAsk] = useState(false);
  // Quizizz-style Power-ups per run
  const [fiftyLeft, setFiftyLeft] = useState(2);
  const [freezeLeft, setFreezeLeft] = useState(2);
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);
  const [frozen, setFrozen] = useState(false);

  const quiz = hydrated ? findQuiz(custom, search.quiz) : undefined;

  useEffect(() => {
    if (!hydrated || !quiz) return;
    const current = useGame.getState().session;
    if (
      current &&
      current.phase !== "done" &&
      current.quiz.id === quiz.id &&
      current.mode === search.mode &&
      current.questionLimit === search.limit
    )
      return;
    if (current?.phase === "done") return;
    setFiftyLeft(2);
    setFreezeLeft(2);
    startRun(quiz, search.mode, search.limit);
  }, [hydrated, quiz, search.mode, search.quiz, search.limit, startRun]);

  // Reset per-question powerup states
  useEffect(() => {
    setEliminatedIds([]);
    setFrozen(false);
  }, [session?.index, session?.lap]);

  useEffect(() => {
    if (session?.phase !== "countdown") return;
    const timer = window.setTimeout(() => tickCountdown(), 650);
    return () => window.clearTimeout(timer);
  }, [session?.phase, session?.countdownN, tickCountdown]);

  useEffect(() => {
    if (session?.phase === "done") void navigate({ to: "/results", replace: true });
  }, [session?.phase, navigate]);

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const live = useGame.getState().session;
      if (live?.phase === "ask" && !live.locked && !frozen) {
        const now = performance.now();
        if (live.attackEndsAt && now >= live.attackEndsAt) useGame.getState().expireAttack();
        else if (live.timeLimit > 0 && live.questionStartedAt > 0 && now >= live.questionStartedAt + live.timeLimit * 1000) {
          useGame.getState().submit({ type: "timeout" });
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [frozen]);

  useEffect(() => {
    if (session?.phase !== "feedback") return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        useGame.getState().continueRun();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session?.phase]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [session?.index, session?.lap]);

  if (!hydrated) {
    return (
      <Shell bare>
        <p className="text-muted">Đang chuẩn bị đấu trường…</p>
      </Shell>
    );
  }

  if (!quiz) {
    return (
      <Shell>
        <h1 className="font-serif text-4xl">Không tìm thấy bộ đề này</h1>
        <Link to="/library" className="mt-4 inline-block text-gold font-bold">
          ← Quay về Kho đề
        </Link>
      </Shell>
    );
  }

  if (!session || session.phase === "done" || session.quiz.id !== quiz.id) {
    return (
      <Shell bare>
        <p className="text-muted">Đang xếp câu hỏi…</p>
      </Shell>
    );
  }

  if (session.phase === "countdown") {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="glass-card p-10 sm:p-14 max-w-md w-full">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-gold">
            <Zap className="size-3.5 fill-gold" /> {MODES.find((item) => item.id === session.mode)?.name}
          </span>
          <p className="pop mt-6 font-serif text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,200,0,0.6)]">
            {session.countdownN}
          </p>
          <p className="mt-4 text-lg font-bold text-white">{session.quiz.title}</p>
          <p className="mt-1 text-xs text-muted">Chuẩn bị tinh thần... Bấm càng nhanh điểm càng cao!</p>
        </div>
      </div>
    );
  }

  const question = currentQuestion(session);
  if (!question) return null;
  const number = session.phase === "feedback" ? Math.max(1, session.seen) : session.seen + 1;
  const total = session.mode === "classic" ? session.order.length : null;
  const feedback = session.feedback;
  const canFifty =
    session.phase === "ask" &&
    fiftyLeft > 0 &&
    eliminatedIds.length === 0 &&
    question.type === "mc" &&
    (question.choices?.length ?? 0) >= 3;

  const canFreeze = session.phase === "ask" && freezeLeft > 0 && !frozen && session.timeLimit > 0;

  function useFiftyFifty() {
    if (!canFifty || !question) return;
    const wrongChoices = (question.choices ?? []).filter((c) => !question.correctIds?.includes(c.id));
    const shuffledWrong = [...wrongChoices].sort(() => Math.random() - 0.5);
    const toRemove = shuffledWrong.slice(0, Math.min(2, wrongChoices.length)).map((c) => c.id);
    setEliminatedIds(toRemove);
    setFiftyLeft((n) => n - 1);
    sfx("tap");
  }

  function useFreezeTimer() {
    if (!canFreeze) return;
    setFrozen(true);
    setFreezeLeft((n) => n - 1);
    sfx("tap");
  }

  const multiplier = (1 + Math.min(Math.max(0, session.streak), 8) * 0.1).toFixed(1);

  return (
    <Shell bare>
      {/* Top Game HUD Bar */}
      <div className="glass-card mb-3 flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStopAsk(true)}
            className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-muted hover:bg-white/20 hover:text-white transition"
          >
            ✕ Thoát
          </button>
          <span className="rounded-xl bg-stage px-3 py-1.5 text-sm font-black tabular text-white border border-white/10">
            Câu {number}
            {total ? <span className="text-muted"> / {total}</span> : ""}
          </span>
        </div>

        {/* Streak & Score HUD */}
        <div className="flex items-center gap-3">
          {session.mode === "survival" && (
            <div className="flex items-center gap-1 rounded-xl bg-rose-500/20 px-2.5 py-1.5" aria-label={`Còn ${session.lives} mạng`}>
              {Array.from({ length: 3 }, (_, index) => (
                <Heart
                  key={index}
                  className={cn(
                    "size-4 transition-transform",
                    index < session.lives ? "fill-rose-500 text-rose-500 scale-100" : "text-white/20 scale-75",
                  )}
                />
              ))}
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-black tabular transition-all",
              session.streak >= 3
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white glow-streak scale-105"
                : session.streak >= 1
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-white/5 text-muted",
            )}
          >
            <Flame className={cn("size-4", session.streak >= 1 && "fill-current")} />
            <span>{session.streak}</span>
            {session.streak >= 2 && <span className="text-[11px] opacity-90">({multiplier}x)</span>}
          </div>

          <div className="rounded-xl bg-gradient-to-r from-gold to-amber-500 px-3.5 py-1.5 text-sm font-black tabular text-ink shadow-md">
            ⚡ {formatScore(session.score)}
          </div>
        </div>
      </div>

      {/* Progress & Timer Bar */}
      {session.mode === "time" && <AttackReadout endsAt={session.attackEndsAt} budget={session.attackBudget} />}
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-stage-2 p-0.5 border border-white/10">
        <TimerBar startedAt={session.questionStartedAt} limit={session.timeLimit} active={session.phase === "ask" && !frozen} frozen={frozen} />
      </div>

      {stopAsk && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stamp/40 bg-stage-2 px-4 py-3 shadow-lg">
          <p className="text-sm font-bold text-white">⚠️ Dừng ván đấu và lưu kết quả hiện tại?</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20"
              onClick={() => setStopAsk(false)}
            >
              Chơi tiếp
            </button>
            <button
              type="button"
              className="rounded-xl bg-stamp px-3.5 py-2 text-xs font-extrabold text-white"
              onClick={quit}
            >
              Kết thúc ván
            </button>
          </div>
        </div>
      )}

      {/* Power-ups Bar (Quizizz Style) */}
      {session.phase === "ask" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {question.type === "mc" && (
              <button
                type="button"
                disabled={!canFifty}
                onClick={useFiftyFifty}
                className={cn(
                  "btn-3d flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                  canFifty
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                    : "bg-stage-2 text-muted/40 opacity-50 cursor-not-allowed",
                )}
              >
                <Scissors className="size-3.5" />
                <span>50/50</span>
                <span className="rounded-full bg-black/30 px-1.5 py-0.2 text-[10px]">{fiftyLeft}</span>
              </button>
            )}

            {session.timeLimit > 0 && (
              <button
                type="button"
                disabled={!canFreeze}
                onClick={useFreezeTimer}
                className={cn(
                  "btn-3d flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                  canFreeze
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                    : "bg-stage-2 text-muted/40 opacity-50 cursor-not-allowed",
                )}
              >
                <Snowflake className="size-3.5" />
                <span>{frozen ? "Đã đóng băng!" : "Đóng băng giờ"}</span>
                <span className="rounded-full bg-black/30 px-1.5 py-0.2 text-[10px]">{freezeLeft}</span>
              </button>
            )}

            {question.hint && !session.hintOpen && (
              <button
                type="button"
                onClick={revealHint}
                className="btn-3d flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-xs font-extrabold text-ink shadow-md"
              >
                <Lightbulb className="size-3.5 fill-ink" />
                <span>Mở Gợi Ý</span>
              </button>
            )}
          </div>

          <span className="hidden text-xs font-bold text-muted sm:inline">
            ⌨️ Mẹo: Bấm phím 1, 2, 3, 4 để chọn nhanh!
          </span>
        </div>
      )}

      {/* Main Question Stage Card */}
      <article
        className={cn(
          "sheet relative overflow-hidden p-5 sm:p-8 border-b-4 border-ink/15",
          feedback?.outcome === "wrong" && "shake",
          feedback?.outcome === "correct" && "pop",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {question.kicker && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stamp/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-stamp">
              <Sparkles className="size-3" /> {question.kicker}
            </span>
          )}
          <span className="text-xs font-bold text-ink-soft">+{question.points} điểm gốc</span>
        </div>

        {question.passage && (
          <div className="mt-3 max-h-40 overflow-auto rounded-xl border-l-4 border-stamp bg-paper-2 p-3.5 text-sm leading-relaxed text-ink">
            {question.passage}
          </div>
        )}

        <h1 className="mt-4 font-serif text-2xl font-extrabold leading-snug text-ink sm:text-3xl whitespace-pre-line">
          {question.prompt}
        </h1>

        {question.image && (
          <img src={question.image} alt="" className="mt-4 max-h-56 w-full rounded-xl object-contain bg-paper-2 p-2" />
        )}

        {session.hintOpen && question.hint && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900">
            <Lightbulb className="size-4 shrink-0 text-amber-600 fill-amber-400" />
            <span>Gợi ý: {question.hint}</span>
          </div>
        )}

        <div className="mt-6">
          <QuestionBoard
            question={question}
            seed={session.seed}
            disabled={session.phase !== "ask"}
            verdict={session.phase === "feedback" ? feedback : null}
            eliminatedIds={eliminatedIds}
            onSubmit={submit}
          />
        </div>
      </article>

      {/* Instant Feedback Banner (Kahoot / Quizizz Style) */}
      {feedback && session.phase === "feedback" && (
        <section
          className={cn(
            "rise mt-4 rounded-3xl p-6 text-white shadow-2xl border-2",
            feedback.outcome === "correct"
              ? "bg-gradient-to-br from-[#00c853] to-[#1b5e20] border-[#69f0ae]"
              : feedback.outcome === "neutral"
                ? "bg-gradient-to-br from-[#2582f7] to-[#0d47a1] border-blue-300"
                : "bg-gradient-to-br from-[#ff1744] to-[#b71c1c] border-rose-300",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black uppercase tracking-widest opacity-85">
                {feedback.outcome === "correct"
                  ? PRAISE_CORRECT[session.seen % PRAISE_CORRECT.length]
                  : feedback.outcome === "neutral"
                    ? "📊 Đã ghi nhận lựa chọn"
                    : PRAISE_WRONG[session.seen % PRAISE_WRONG.length]}
              </span>
              <h2 className="mt-1 font-serif text-3xl font-black">
                {feedback.outcome === "correct"
                  ? "CHÍNH XÁC!"
                  : feedback.outcome === "neutral"
                    ? "ĐÃ GHI NHẬN"
                    : feedback.timedOut
                      ? "HẾT GIỜ RỒI!"
                      : "CHƯA CHÍNH XÁC!"}
              </h2>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-2 text-right backdrop-blur-xs">
              <span className="block text-[10px] font-bold uppercase opacity-80">Điểm nhận được</span>
              <span className="tabular text-2xl font-black text-gold">+{formatScore(feedback.gained)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-black/20 p-4 text-sm leading-relaxed backdrop-blur-xs">
            <p className="font-semibold opacity-90">• Bạn đã chọn: {feedback.given}</p>
            {feedback.outcome !== "neutral" && (
              <p className="mt-1 font-extrabold text-gold">✓ Đáp án đúng: {feedback.answer}</p>
            )}
            {feedback.explanation && (
              <p className="mt-2 border-t border-white/15 pt-2 text-white/95">
                💡 <strong>Giải thích:</strong> {feedback.explanation}
              </p>
            )}
          </div>

          {feedback.poll && (
            <div className="mt-4 grid gap-2">
              {feedback.poll.map((row) => (
                <div key={row.id}>
                  <div className="flex justify-between gap-3 text-sm font-bold">
                    <span>{row.text}</span>
                    <span className="tabular">{row.pct}%</span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-black/25">
                    <div className="h-2.5 rounded-full bg-gold" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={continueRun}
            className="btn-3d mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-lg font-black text-ink shadow-xl"
          >
            <span>CÂU TIẾP THEO</span>
            <span className="text-xs font-bold text-ink-soft">(Enter ↵)</span>
          </button>
        </section>
      )}
    </Shell>
  );
}

function TimerBar({
  startedAt,
  limit,
  active,
  frozen,
}: {
  startedAt: number;
  limit: number;
  active: boolean;
  frozen?: boolean;
}) {
  const now = useNow(active && limit > 0);
  if (frozen) {
    return <div className="h-full w-full rounded-full bg-cyan-400 animate-pulse" />;
  }
  if (limit <= 0) return <div className="h-full w-full rounded-full bg-gradient-to-r from-gold to-mint" />;
  const remain = Math.max(0, limit - (now - startedAt) / 1000);
  const pct = Math.max(0, Math.min(1, remain / limit));
  return (
    <div
      className={cn(
        "h-full rounded-full transition-colors",
        pct < 0.25
          ? "bg-gradient-to-r from-red-600 to-rose-400"
          : pct < 0.55
            ? "bg-gradient-to-r from-amber-500 to-yellow-300"
            : "bg-gradient-to-r from-mint to-emerald-400",
      )}
      style={{ width: `${pct * 100}%` }}
    />
  );
}

function AttackReadout({ endsAt, budget }: { endsAt: number | null; budget: number }) {
  const now = useNow(Boolean(endsAt));
  const remain = endsAt ? Math.max(0, (endsAt - now) / 1000) : budget / 1000;
  return (
    <div className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-gold">
      <Timer className="size-4" />
      <span>Đồng hồ Nước rút còn: {formatClock(remain)}</span>
    </div>
  );
}
