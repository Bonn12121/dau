import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DauIcon } from "@/components/marks";
import { QuestionBoard } from "@/components/question-board";
import { Shell } from "@/components/shell";
import { formatClock, formatScore } from "@/game/engine";
import { findQuiz } from "@/game/quizzes";
import { sfx } from "@/game/sound";
import { currentQuestion, useGame } from "@/game/store";
import { MODES, type Mode } from "@/game/types";
import { cn } from "@/lib/cn";
import { useRealtimeRank, RankPill, OvertakeScreen } from "@/components/realtime-rank";
import { useAdminAbuse, AdminAbuseWarzone } from "@/components/admin-abuse";

function isMode(value: unknown): value is Mode {
  return value === "classic" || value === "time" || value === "survival" || value === "endless" || value === "admin";
}

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
  const quit = useGame((s) => s.quit);

  const [stopAsk, setStopAsk] = useState(false);
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);
  const [frozen, setFrozen] = useState(false);

  const useItem = useGame((s) => s.useItem);
  const quiz = hydrated ? findQuiz(custom, search.quiz) : undefined;

  // Realtime leaderboard ranking & overtake screen
  const { rank, showOvertake, overtakeRank, dismissOvertake } = useRealtimeRank(
    quiz?.id ?? "",
    session?.score ?? 0,
    session?.streak ?? 0,
    search.mode
  );

  // Admin Abuse events
  const { screenShake, siren, particles } = useAdminAbuse(search.mode === "admin");
  const skipQuestion = useGame((s) => s.skipQuestion);

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
    startRun(quiz, search.mode, search.limit);
  }, [hydrated, quiz, search.mode, search.quiz, search.limit, startRun]);

  useEffect(() => {
    setEliminatedIds([]);
    setFrozen(false);
  }, [session?.index, session?.lap]);

  useEffect(() => {
    if (session?.phase !== "countdown") return;
    const timer = window.setTimeout(() => tickCountdown(), 550);
    return () => window.clearTimeout(timer);
  }, [session?.phase, session?.countdownN, tickCountdown]);

  useEffect(() => {
    if (session?.phase === "done") void navigate({ to: "/results", replace: true });
  }, [session?.phase, navigate]);

  // AUTO-ADVANCE: Correct answers move immediately (~550ms), Wrong answers pause briefly (~1100ms) so you see the green correct tile, then next!
  useEffect(() => {
    if (session?.phase !== "feedback" || !session.feedback) return;
    const delay = session.feedback.outcome === "correct" ? 550 : 1100;
    const timer = window.setTimeout(() => {
      useGame.getState().continueRun();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session?.phase, session?.seen, session?.feedback]);

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
    window.scrollTo(0, 0);
  }, [session?.index, session?.lap]);

  if (!hydrated) {
    return (
      <Shell bare>
        <p className="text-muted">Đang chuẩn bị…</p>
      </Shell>
    );
  }

  if (!quiz) {
    return (
      <Shell>
        <h1 className="font-serif text-3xl">Không tìm thấy đề</h1>
        <Link to="/library" className="mt-4 inline-block text-gold font-semibold">
          Về Tủ đề
        </Link>
      </Shell>
    );
  }

  if (!session || session.phase === "done" || session.quiz.id !== quiz.id) {
    return (
      <Shell bare>
        <p className="text-muted">Đang xếp câu…</p>
      </Shell>
    );
  }

  if (session.phase === "countdown") {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            {MODES.find((item) => item.id === session.mode)?.name}
          </p>
          <p key={session.countdownN} className="count-in mt-3 font-serif text-9xl font-extrabold text-white">{session.countdownN}</p>
          <p className="mt-3 text-base font-medium text-muted">{session.quiz.title}</p>
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
    (session.items?.fifty ?? 0) > 0 &&
    eliminatedIds.length === 0 &&
    question.type === "mc" &&
    (question.choices?.length ?? 0) >= 3;

  const canFreeze =
    session.phase === "ask" && (session.items?.freeze ?? 0) > 0 && !frozen && session.timeLimit > 0;
  const canDouble =
    session.phase === "ask" && (session.items?.double ?? 0) > 0 && session.doubleLeft === 0;
  const canShield =
    session.phase === "ask" && (session.items?.shield ?? 0) > 0 && session.shields === 0;
  const canSkip = session.phase === "ask" && (session.mode === "admin" || (session.items?.skip ?? 0) > 0);
  const canNuke = session.phase === "ask" && (session.items?.nuke ?? 0) > 0 && question.type === "mc";
  const canReveal = session.phase === "ask" && (session.items?.reveal ?? 0) > 0 && !session.hintOpen;

  function useFiftyFifty() {
    if (!canFifty || !question) return;
    const ok = useItem("fifty");
    if (!ok) return;
    const wrongChoices = (question.choices ?? []).filter((c) => !question.correctIds?.includes(c.id));
    const shuffledWrong = [...wrongChoices].sort(() => Math.random() - 0.5);
    const toRemove = shuffledWrong.slice(0, Math.min(2, wrongChoices.length)).map((c) => c.id);
    setEliminatedIds(toRemove);
  }

  function useFreezeTimer() {
    if (!canFreeze) return;
    const ok = useItem("freeze");
    if (ok) setFrozen(true);
  }

  function useDoublePoints() {
    if (!canDouble) return;
    useItem("double");
  }

  function useShield() {
    if (!canShield) return;
    useItem("shield");
  }

  function handleSkip() {
    if (!canSkip) return;
    skipQuestion();
  }

  function useNuke() {
    if (!canNuke || !question || !question.correctIds) return;
    const ok = useItem("nuke");
    if (!ok) return;
    // Eliminates all wrong choices leaving only the correct answer
    const wrong = (question.choices ?? []).filter((c) => !question.correctIds?.includes(c.id)).map((c) => c.id);
    setEliminatedIds(wrong);
  }

  function useReveal() {
    if (!canReveal) return;
    const ok = useItem("reveal");
    if (ok) useGame.getState().revealHint();
  }

  return (
    <Shell bare>
      <AdminAbuseWarzone shake={screenShake} siren={siren} particles={particles} />
      {showOvertake && (
        <OvertakeScreen
          rank={overtakeRank}
          onContinue={() => {
            dismissOvertake();
            if (session.phase === "feedback") continueRun();
          }}
        />
      )}

      {/* Clean Compact Top HUD */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStopAsk(true)}
            className="rounded-lg bg-stage-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-white"
          >
            Dừng
          </button>
          <span className="tabular text-sm font-bold text-white">
            {session.retryRound ? "Thử lại câu sai" : `Câu ${number}`}
            {total && !session.retryRound ? <span className="text-muted"> / {total}</span> : ""}
          </span>
          <RankPill rank={rank} />
        </div>

        <div className="flex items-center gap-2.5">
          {session.mode === "survival" && (
            <div className="flex items-center gap-1" aria-label={`Còn ${session.lives} mạng`}>
              {Array.from({ length: 3 }, (_, index) => (
                <DauIcon
                  key={index}
                  name="survival"
                  className={cn("size-4", index < session.lives ? "text-stamp" : "text-line")}
                />
              ))}
            </div>
          )}

          {session.streak > 1 && (
            <div className="flex items-center gap-1 rounded-lg bg-gold/15 px-2.5 py-1 text-xs font-bold tabular text-gold">
              <DauIcon name="streak" className="size-3.5" />
              <span>{session.streak}x</span>
            </div>
          )}

          <div className="rounded-lg bg-stage-2 px-3 py-1 text-sm font-extrabold tabular text-gold">
            <span key={session.score} className="score-bump">{formatScore(session.score)}</span>
          </div>
        </div>
      </div>

      {total && (
        <div className="mb-2 flex gap-1">
          {Array.from({ length: Math.min(total, 40) }, (_, i) => {
            const log = session.logs[i];
            return (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  log ? (log.outcome === "correct" ? "bg-[#26890c]" : "bg-[#e21b3c]") : i === session.index ? "bg-white/60" : "bg-stage-2",
                )}
              />
            );
          })}
        </div>
      )}

      {/* Slim Timer Bar */}
      {session.mode === "time" && <AttackReadout endsAt={session.attackEndsAt} budget={session.attackBudget} />}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-stage-2">
        <TimerBar
          startedAt={session.questionStartedAt}
          limit={session.timeLimit}
          active={session.phase === "ask" && !frozen}
          frozen={frozen}
        />
      </div>

      {stopAsk && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-control bg-stage-2 px-4 py-3">
          <p className="text-sm font-medium">Dừng ván và lưu điểm hiện tại?</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-stage-soft px-3 py-1.5 text-xs font-semibold text-white"
              onClick={() => setStopAsk(false)}
            >
              Chơi tiếp
            </button>
            <button
              type="button"
              className="rounded-lg bg-stamp px-3 py-1.5 text-xs font-bold text-white"
              onClick={quit}
            >
              Dừng
            </button>
          </div>
        </div>
      )}

      {/* Question Card */}
      <article
        key={`${session.index}-${session.lap}`}
        onClick={() => {
          if (session.phase === "feedback") continueRun();
        }}
        className={cn(
          "sheet card-in relative p-5 sm:p-7 transition-transform duration-100",
          screenShake && "animate-bounce scale-[1.02] border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.5)]",
          feedback?.outcome === "wrong" && "shake",
          feedback?.outcome === "correct" && "pop",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          {question.kicker && (
            <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
              {question.kicker}
            </span>
          )}
          {feedback && (
            <span
              className={cn(
                "rounded-full px-3 py-0.5 text-xs font-extrabold tabular",
                feedback.outcome === "correct"
                  ? "bg-[#26890c] text-white"
                  : "bg-[#e21b3c] text-white",
              )}
            >
              {feedback.outcome === "correct" ? `+${formatScore(feedback.gained)}` : "Sai"}
            </span>
          )}
        </div>

        {question.passage && (
          <p className="mt-3 max-h-36 overflow-auto rounded-lg bg-paper-2 p-3 text-sm leading-relaxed text-ink">
            {question.passage}
          </p>
        )}

        <h1 className="mt-3 font-serif text-2xl font-bold leading-snug text-ink sm:text-3xl whitespace-pre-line">
          {question.prompt}
        </h1>

        {question.image && (
          <img src={question.image} alt="" className="mt-4 max-h-52 w-full rounded-control object-contain" />
        )}

        <div className="mt-5">
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

      {/* Minimal Bottom Power-ups Bar */}
      {session.phase === "ask" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {question.type === "mc" && (
              <button
                type="button"
                disabled={!canFifty}
                onClick={useFiftyFifty}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  canFifty
                    ? "bg-stage-soft text-white hover:bg-line"
                    : "bg-stage-2 text-muted/40 cursor-not-allowed",
                )}
              >
                <DauIcon name="fifty" className="size-3.5" />
                <span>50/50 ({session.items?.fifty ?? 0})</span>
              </button>
            )}

            {session.timeLimit > 0 && (
              <button
                type="button"
                disabled={!canFreeze}
                onClick={useFreezeTimer}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  canFreeze
                    ? "bg-stage-soft text-white hover:bg-line"
                    : "bg-stage-2 text-muted/40 cursor-not-allowed",
                )}
              >
                <DauIcon name="freeze" className="size-3.5" />
                <span>{frozen ? "Đã dừng giờ" : `Dừng giờ (${session.items?.freeze ?? 0})`}</span>
              </button>
            )}

            <button
              type="button"
              disabled={!canDouble}
              onClick={useDoublePoints}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                session.doubleLeft > 0
                  ? "bg-gold text-ink font-extrabold"
                  : canDouble
                  ? "bg-stage-soft text-white hover:bg-line"
                  : "bg-stage-2 text-muted/40 cursor-not-allowed"
              )}
            >
              <DauIcon name="double" className="size-3.5" />
              <span>{session.doubleLeft > 0 ? "x2 Đang bật!" : `x2 Điểm (${session.items?.double ?? 0})`}</span>
            </button>

            <button
              type="button"
              disabled={!canShield}
              onClick={useShield}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                session.shields > 0
                  ? "bg-[#26890c] text-white font-extrabold"
                  : canShield
                  ? "bg-stage-soft text-white hover:bg-line"
                  : "bg-stage-2 text-muted/40 cursor-not-allowed"
              )}
            >
              <DauIcon name="shield" className="size-3.5" />
              <span>{session.shields > 0 ? "Khiên bật!" : `Khiên (${session.items?.shield ?? 0})`}</span>
            </button>

            {/* Admin & Loot Items: Skip, Nuke, Reveal */}
            <button
              type="button"
              disabled={!canSkip}
              onClick={handleSkip}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition",
                session.mode === "admin"
                  ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30"
                  : canSkip
                  ? "bg-stage-soft text-white hover:bg-line"
                  : "bg-stage-2 text-muted/40 cursor-not-allowed"
              )}
            >
              <DauIcon name="skip" className="size-3.5" />
              <span>{session.mode === "admin" ? "Skip câu ⚡ (Free)" : `Skip (${session.items?.skip ?? 0})`}</span>
            </button>

            {question.type === "mc" && (
              <button
                type="button"
                disabled={!canNuke}
                onClick={useNuke}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition",
                  canNuke
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
                    : "bg-stage-2 text-muted/40 cursor-not-allowed"
                )}
              >
                <DauIcon name="nuke" className="size-3.5" />
                <span>Nuke 💣 ({session.items?.nuke ?? 0})</span>
              </button>
            )}

            <button
              type="button"
              disabled={!canReveal}
              onClick={useReveal}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                canReveal
                  ? "bg-stage-soft text-white hover:bg-line"
                  : "bg-stage-2 text-muted/40 cursor-not-allowed"
              )}
            >
              <DauIcon name="reveal" className="size-3.5" />
              <span>Gợi ý ({session.items?.reveal ?? 0})</span>
            </button>
          </div>

          <span className="hidden text-xs text-muted sm:inline">Phím tắt: 1, 2, 3, 4</span>
        </div>
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
  if (frozen) return <div className="h-full w-full bg-sky-400" />;
  if (limit <= 0) return <div className="h-full w-full bg-gold/50" />;
  const remain = Math.max(0, limit - (now - startedAt) / 1000);
  const pct = Math.max(0, Math.min(1, remain / limit));
  return (
    <div
      className={cn("h-full", pct < 0.25 ? "bg-[#e21b3c]" : pct < 0.55 ? "bg-[#ffa602]" : "bg-[#26890c]")}
      style={{ width: `${pct * 100}%` }}
    />
  );
}

function AttackReadout({ endsAt, budget }: { endsAt: number | null; budget: number }) {
  const now = useNow(Boolean(endsAt));
  const remain = endsAt ? Math.max(0, (endsAt - now) / 1000) : budget / 1000;
  return <p className="mb-1.5 text-xs font-semibold text-gold">Nước rút còn {formatClock(remain)}</p>;
}
