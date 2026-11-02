import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QuestionBoard } from "@/components/question-board";
import { Shell } from "@/components/shell";
import { formatClock, formatScore } from "@/game/engine";
import { findQuiz } from "@/game/quizzes";
import { currentQuestion, useGame } from "@/game/store";
import { MODES, type Mode } from "@/game/types";
import { cn } from "@/lib/cn";

function isMode(value: unknown): value is Mode {
  return value === "classic" || value === "time" || value === "survival" || value === "endless";
}

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>): { quiz: string; mode: Mode; limit?: number } => ({
    quiz: typeof search.quiz === "string" ? search.quiz : "gdcd-gk1-2627",
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
    startRun(quiz, search.mode, search.limit);
  }, [hydrated, quiz, search.mode, search.quiz, search.limit, startRun]);

  useEffect(() => {
    if (session?.phase !== "countdown") return;
    const timer = window.setTimeout(() => tickCountdown(), 680);
    return () => window.clearTimeout(timer);
  }, [session?.phase, session?.countdownN, tickCountdown]);

  useEffect(() => {
    if (session?.phase === "done") void navigate({ to: "/results", replace: true });
  }, [session?.phase, navigate]);

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const live = useGame.getState().session;
      if (live?.phase === "ask" && !live.locked) {
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
  }, []);

  useEffect(() => {
    if (session?.phase !== "feedback") return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Enter") useGame.getState().continueRun();
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
        <p className="text-muted">Đang xếp câu…</p>
      </Shell>
    );
  }

  if (!quiz) {
    return (
      <Shell>
        <h1 className="font-serif text-4xl">Không thấy đề này</h1>
        <Link to="/library" className="mt-4 inline-block text-gold">
          Về tủ đề
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
          <p className="text-xs uppercase tracking-widest text-muted">{MODES.find((item) => item.id === session.mode)?.name}</p>
          <p className="pop mt-4 font-serif text-8xl text-paper">{session.countdownN}</p>
          <p className="mt-3 text-muted">{session.quiz.title}</p>
        </div>
      </div>
    );
  }

  const question = currentQuestion(session);
  if (!question) return null;
  const number = session.phase === "feedback" ? Math.max(1, session.seen) : session.seen + 1;
  const total = session.mode === "classic" ? session.order.length : null;
  const feedback = session.feedback;

  return (
    <Shell bare>
      <div className="mb-4 flex items-center gap-3">
        <button type="button" onClick={() => setStopAsk(true)} className="min-h-11 text-sm text-muted">
          Dừng
        </button>
        <p className="tabular text-sm text-muted">
          Câu {number}
          {total ? ` / ${total}` : ""}
        </p>
        <p className="ml-auto tabular font-semibold text-gold">{formatScore(session.score)}</p>
        <p className={cn("tabular text-sm", session.streak > 1 ? "text-gold" : "text-muted")}>Chuỗi {session.streak}</p>
        {session.mode === "survival" && (
          <p className="text-sm" aria-label={`Còn ${session.lives} mạng`}>
            {Array.from({ length: 3 }, (_, index) => (
              <span
                key={index}
                className={cn("mx-0.5 inline-block size-2.5 rounded-full", index < session.lives ? "bg-stamp" : "bg-line")}
              />
            ))}
          </p>
        )}
      </div>
      {session.mode === "time" && <AttackReadout endsAt={session.attackEndsAt} budget={session.attackBudget} />}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-stage-soft">
        <TimerBar startedAt={session.questionStartedAt} limit={session.timeLimit} active={session.phase === "ask"} />
      </div>
      {stopAsk && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-control bg-stage-soft px-4 py-3">
          <p className="text-sm">Dừng ván và giữ điểm hiện tại?</p>
          <button type="button" className="min-h-11 text-sm text-muted" onClick={() => setStopAsk(false)}>
            Ở lại
          </button>
          <button type="button" className="min-h-11 text-sm font-semibold text-stamp" onClick={quit}>
            Dừng
          </button>
        </div>
      )}
      <article
        className={cn("sheet p-5 sm:p-7", feedback?.outcome === "wrong" && "shake", feedback?.outcome === "correct" && "pop")}
      >
        {question.kicker && <p className="text-xs font-semibold uppercase tracking-widest text-stamp">{question.kicker}</p>}
        {question.passage && <p className="mt-3 max-h-36 overflow-auto text-sm leading-relaxed text-ink-soft">{question.passage}</p>}
        <h1 className="mt-3 font-serif text-3xl leading-snug sm:text-4xl">{question.prompt}</h1>
        {question.image && <img src={question.image} alt="" className="mt-4 max-h-52 w-full rounded-control object-contain" />}
        {session.hintOpen && question.hint && <p className="mt-3 text-sm text-ink-soft">Gợi ý: {question.hint}</p>}
        <div className="mt-5">
          <QuestionBoard
            question={question}
            seed={session.seed}
            disabled={session.phase !== "ask"}
            verdict={session.phase === "feedback" ? feedback : null}
            onSubmit={submit}
          />
        </div>
      </article>
      {session.phase === "ask" && question.hint && !session.hintOpen && (
        <button type="button" onClick={revealHint} className="mt-4 min-h-11 text-sm text-gold">
          Xin gợi ý
        </button>
      )}
      {feedback && session.phase === "feedback" && (
        <section className="sheet mt-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-3xl">
              {feedback.outcome === "correct" ? "Đúng" : feedback.outcome === "neutral" ? "Đã ghi" : "Chưa đúng"}
            </h2>
            <p className="rounded-control bg-gold px-3 py-1 font-semibold tabular text-gold-ink">+{formatScore(feedback.gained)}</p>
          </div>
          {feedback.timedOut && <p className="mt-2 text-sm text-stamp">Hết giờ câu này.</p>}
          <p className="mt-3 text-sm text-ink-soft">Bạn chọn: {feedback.given}</p>
          {feedback.outcome !== "neutral" && <p className="mt-1 text-sm">Đáp án: {feedback.answer}</p>}
          {feedback.explanation && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{feedback.explanation}</p>}
          {feedback.poll && (
            <div className="mt-4 grid gap-2">
              {feedback.poll.map((row) => (
                <div key={row.id}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span>{row.text}</span>
                    <span className="tabular">{row.pct}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-paper-2">
                    <div className="h-2 rounded-full bg-stamp" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={continueRun} className="mt-5 min-h-12 w-full rounded-control bg-ink font-semibold text-paper">
            Tiếp tục
          </button>
        </section>
      )}
    </Shell>
  );
}

function TimerBar({ startedAt, limit, active }: { startedAt: number; limit: number; active: boolean }) {
  const now = useNow(active && limit > 0);
  if (limit <= 0) return <div className="h-full w-full bg-gold/40" />;
  const remain = Math.max(0, limit - (now - startedAt) / 1000);
  const pct = Math.max(0, Math.min(1, remain / limit));
  return <div className={cn("h-full", pct < 0.25 ? "bg-stamp" : "bg-gold")} style={{ width: `${pct * 100}%` }} />;
}

function AttackReadout({ endsAt, budget }: { endsAt: number | null; budget: number }) {
  const now = useNow(Boolean(endsAt));
  const remain = endsAt ? Math.max(0, (endsAt - now) / 1000) : budget / 1000;
  return <p className="mb-2 text-sm text-muted">Nước rút còn {formatClock(remain)}</p>;
}
