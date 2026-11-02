import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Seal, Shell } from "@/components/shell";
import { useLaunch } from "@/components/use-launch";
import { formatScore } from "@/game/engine";
import { BUILTINS } from "@/game/quizzes";
import { bestScore, useGame } from "@/game/store";
import { DIFFICULTY_LABEL, MODES, type Mode } from "@/game/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [mode, setMode] = useState<Mode>("classic");
  const records = useGame((s) => s.records);
  const launch = useLaunch();
  const featured = BUILTINS[0]!;
  const modeMeta = MODES.find((item) => item.id === mode)!;

  return (
    <Shell wide>
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Một người chơi · Không phòng · Không tài khoản</p>
      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h1 className="font-serif text-5xl leading-tight text-paper sm:text-6xl">
            Đề nằm trên bàn.
            <span className="block text-gold">Nhịp nằm ở bạn.</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            Làm đề giữa kỳ GDCD 9, hoặc bất kỳ đề nào bạn soạn. Điểm cộng tốc độ, chuỗi đúng được giữ, sai là mất nhịp.
          </p>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {MODES.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={cn("flex w-full items-baseline gap-4 py-4 text-left", mode === item.id ? "text-paper" : "text-muted")}
                >
                  <span className="tabular w-8 text-sm text-gold">0{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-2xl">{item.name}</span>
                    <span className="mt-1 block text-sm">{item.blurb}</span>
                  </span>
                  <span className="hidden text-xs uppercase tracking-widest sm:block">{item.en}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <article className="sheet relative overflow-hidden p-6 sm:p-8">
          <Seal className="seal-in absolute right-5 top-5" />
          <p className="text-xs font-semibold uppercase tracking-widest text-stamp">Đề chính</p>
          <h2 className="mt-3 max-w-xs font-serif text-4xl leading-tight">{featured.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{featured.description}</p>
          <p className="mt-4 text-sm text-ink-soft">
            {featured.questions.length} câu · {DIFFICULTY_LABEL[featured.difficulty]} · thang 10 điểm
          </p>
          <button
            type="button"
            onClick={() => launch(featured.id, mode)}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-control bg-ink px-4 py-3 font-semibold text-paper"
          >
            Làm đề · {modeMeta.name}
          </button>
          <p className="mt-3 text-xs text-ink-soft">
            Kỷ lục {modeMeta.name.toLowerCase()}: {formatScore(bestScore(records, featured.id, mode))}
          </p>
        </article>
      </div>

    </Shell>
  );
}
