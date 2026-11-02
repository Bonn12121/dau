import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QuestionBoard } from "@/components/question-board";
import { Shell } from "@/components/shell";
import { blankQuestion, blankQuiz } from "@/game/blank";
import { grade, questionIssues, quizIssues, uid } from "@/game/engine";
import { findQuiz } from "@/game/quizzes";
import { exportPayload } from "@/game/schema";
import { useGame } from "@/game/store";
import { DIFFICULTY_LABEL, TYPE_LABEL, type Difficulty, type QType, type Question, type Quiz } from "@/game/types";

export const Route = createFileRoute("/studio")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : "",
  }),
  component: Studio,
});

const TYPES = Object.keys(TYPE_LABEL) as QType[];
const DIFFS = Object.keys(DIFFICULTY_LABEL) as Difficulty[];

function Studio() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const hydrated = useGame((s) => s.hydrated);
  const custom = useGame((s) => s.custom);
  const saveQuiz = useGame((s) => s.saveQuiz);
  const deleteQuiz = useGame((s) => s.deleteQuiz);
  const [draft, setDraft] = useState<Quiz | null>(null);
  const [qi, setQi] = useState(0);
  const [error, setError] = useState("");
  const [previewSeed, setPreviewSeed] = useState(1);
  const [previewOn, setPreviewOn] = useState(false);

  useEffect(() => {
    if (!hydrated || !search.id) return;
    const found = findQuiz(useGame.getState().custom, search.id);
    if (!found || found.builtin) return;
    setDraft(structuredClone(found));
    setQi(0);
  }, [hydrated, search.id]);

  if (!hydrated) {
    return (
      <Shell>
        <p className="text-muted">Đang mở tủ…</p>
      </Shell>
    );
  }

  const found = search.id ? findQuiz(custom, search.id) : undefined;

  if (!search.id || !found) {
    return (
      <Shell>
        <p className="text-xs uppercase tracking-widest text-muted">Soạn đề</p>
        <h1 className="font-serif text-5xl">Đề của bạn</h1>
        <p className="mt-3 max-w-xl text-muted">Đề nằm trên máy này. Xuất JSON nếu muốn mang sang trình duyệt khác.</p>
        <button
          type="button"
          className="mt-6 min-h-12 rounded-control bg-paper px-5 font-semibold text-ink"
          onClick={() => {
            const quiz = blankQuiz();
            if (!saveQuiz(quiz)) return;
            void navigate({ to: "/studio", search: { id: quiz.id } });
          }}
        >
          Tạo đề mới
        </button>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {custom.map((quiz) => (
            <li key={quiz.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-serif text-2xl">{quiz.title}</p>
                <p className="text-sm text-muted">{quiz.questions.length} câu</p>
              </div>
              <Link to="/studio" search={{ id: quiz.id }} className="text-sm text-gold">
                Mở
              </Link>
            </li>
          ))}
        </ul>
        {custom.length === 0 && <p className="mt-6 text-muted">Chưa có đề tự soạn.</p>}
      </Shell>
    );
  }

  if (found.builtin) {
    return (
      <Shell>
        <h1 className="font-serif text-4xl">{found.title}</h1>
        <p className="mt-3 text-muted">Đề có sẵn không sửa trực tiếp. Hãy nhân bản rồi chỉnh.</p>
        <button
          type="button"
          className="mt-6 min-h-12 rounded-control bg-paper px-5 font-semibold text-ink"
          onClick={() => {
            const copy = structuredClone(found);
            copy.id = uid("quiz");
            copy.builtin = false;
            copy.title = `${found.title} (bản sao)`;
            if (!saveQuiz(copy)) return;
            void navigate({ to: "/studio", search: { id: copy.id } });
          }}
        >
          Nhân bản để sửa
        </button>
      </Shell>
    );
  }

  if (!draft) {
    return (
      <Shell>
        <p className="text-muted">Đang mở đề…</p>
      </Shell>
    );
  }

  const question = draft.questions[qi] ?? draft.questions[0];

  function patchQuiz(partial: Partial<Quiz>) {
    setDraft((curr) => (curr ? { ...curr, ...partial } : curr));
  }

  function patchQuestion(partial: Partial<Question>) {
    setDraft((curr) => {
      if (!curr) return curr;
      return {
        ...curr,
        questions: curr.questions.map((item, index) => (index === qi ? { ...item, ...partial } : item)),
      };
    });
  }

  function replaceQuestion(next: Question) {
    setDraft((curr) => {
      if (!curr) return curr;
      return { ...curr, questions: curr.questions.map((item, index) => (index === qi ? next : item)) };
    });
  }

  if (!question) return null;

  return (
    <Shell wide>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/studio" search={{ id: "" }} className="text-sm text-muted">
          Tất cả đề
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-control bg-stage-soft px-3 text-sm"
            onClick={() => {
              const blob = new Blob([JSON.stringify(exportPayload(draft), null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${draft.title || "de"}.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Xuất JSON
          </button>
          <button
            type="button"
            className="min-h-11 rounded-control bg-paper px-4 text-sm font-semibold text-ink"
            onClick={() => {
              const issue = quizIssues(draft);
              if (issue) {
                setError(issue);
                return;
              }
              setError("");
              saveQuiz(draft);
            }}
          >
            Lưu đề
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-stamp">{error}</p>}
      <div className="mt-4 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside>
          <ol className="grid gap-1">
            {draft.questions.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setQi(index);
                    setPreviewOn(false);
                  }}
                  className={index === qi ? "w-full rounded-control bg-paper px-3 py-2 text-left text-sm text-ink" : "w-full rounded-control px-3 py-2 text-left text-sm text-muted"}
                >
                  {index + 1}. {TYPE_LABEL[item.type]}
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="mt-3 min-h-11 w-full rounded-control bg-stage-soft text-sm"
            onClick={() => {
              const next = blankQuestion("mc");
              setDraft({ ...draft, questions: [...draft.questions, next] });
              setQi(draft.questions.length);
            }}
          >
            Thêm câu
          </button>
        </aside>
        <div className="sheet p-5">
          <label className="block text-sm text-ink-soft">
            Tên đề
            <input
              value={draft.title}
              onChange={(event) => patchQuiz({ title: event.target.value })}
              className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-ink outline-none ring-1 ring-ink/10"
            />
          </label>
          <label className="mt-3 block text-sm text-ink-soft">
            Mô tả
            <textarea
              value={draft.description}
              onChange={(event) => patchQuiz({ description: event.target.value })}
              rows={2}
              className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-ink outline-none ring-1 ring-ink/10"
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-ink-soft">
              Chủ đề
              <input
                value={draft.category}
                onChange={(event) => patchQuiz({ category: event.target.value })}
                className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-ink outline-none ring-1 ring-ink/10"
              />
            </label>
            <label className="text-sm text-ink-soft">
              Độ khó
              <select
                value={draft.difficulty}
                onChange={(event) => patchQuiz({ difficulty: event.target.value as Difficulty })}
                className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-ink outline-none"
              >
                {DIFFS.map((item) => (
                  <option key={item} value={item}>
                    {DIFFICULTY_LABEL[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
            <label className="text-sm text-ink-soft">
              Dạng câu
              <select
                value={question.type}
                onChange={(event) => {
                  const type = event.target.value as QType;
                  const fresh = blankQuestion(type);
                  fresh.id = question.id;
                  fresh.prompt = question.prompt;
                  fresh.explanation = question.explanation;
                  fresh.hint = question.hint;
                  fresh.kicker = question.kicker;
                  replaceQuestion(fresh);
                  setPreviewOn(false);
                }}
                className="ml-2 rounded-control bg-paper-2 px-2 py-2 text-ink"
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="min-h-11 text-sm text-ink-soft"
              onClick={() => {
                const copy = structuredClone(question);
                copy.id = uid("q");
                const questions = [...draft.questions];
                questions.splice(qi + 1, 0, copy);
                setDraft({ ...draft, questions });
                setQi(qi + 1);
              }}
            >
              Nhân đôi
            </button>
            <button
              type="button"
              className="min-h-11 text-sm"
              disabled={qi === 0}
              onClick={() => {
                const questions = [...draft.questions];
                const [item] = questions.splice(qi, 1);
                if (!item) return;
                questions.splice(qi - 1, 0, item);
                setDraft({ ...draft, questions });
                setQi(qi - 1);
              }}
            >
              Lên
            </button>
            <button
              type="button"
              className="min-h-11 text-sm"
              disabled={qi >= draft.questions.length - 1}
              onClick={() => {
                const questions = [...draft.questions];
                const [item] = questions.splice(qi, 1);
                if (!item) return;
                questions.splice(qi + 1, 0, item);
                setDraft({ ...draft, questions });
                setQi(qi + 1);
              }}
            >
              Xuống
            </button>
            <button
              type="button"
              className="min-h-11 text-sm text-stamp"
              disabled={draft.questions.length < 2}
              onClick={() => {
                const questions = draft.questions.filter((_, index) => index !== qi);
                setDraft({ ...draft, questions });
                setQi(Math.max(0, qi - 1));
              }}
            >
              Xóa câu
            </button>
          </div>
          <label className="mt-4 block text-sm text-ink-soft">
            Câu hỏi
            <textarea
              value={question.prompt}
              onChange={(event) => patchQuestion({ prompt: event.target.value })}
              rows={3}
              className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-base text-ink outline-none ring-1 ring-ink/10"
            />
          </label>
          <label className="mt-3 block text-sm text-ink-soft">
            Đoạn dẫn (tuỳ chọn)
            <textarea
              value={question.passage ?? ""}
              onChange={(event) => patchQuestion({ passage: event.target.value })}
              rows={2}
              className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-ink outline-none ring-1 ring-ink/10"
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-ink-soft">
              Giây
              <input
                type="number"
                min={0}
                max={600}
                value={question.timeLimit}
                onChange={(event) => patchQuestion({ timeLimit: Number(event.target.value) })}
                className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-ink outline-none"
              />
            </label>
            <label className="text-sm text-ink-soft">
              Điểm
              <input
                type="number"
                min={0}
                value={question.points}
                onChange={(event) => patchQuestion({ points: Number(event.target.value) })}
                className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-ink outline-none"
              />
            </label>
          </div>
          <TypeFields question={question} onChange={patchQuestion} />
          <label className="mt-3 block text-sm text-ink-soft">
            Giải thích
            <textarea
              value={question.explanation ?? ""}
              onChange={(event) => patchQuestion({ explanation: event.target.value })}
              rows={2}
              className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-ink outline-none ring-1 ring-ink/10"
            />
          </label>
          <label className="mt-3 block text-sm text-ink-soft">
            Gợi ý
            <input
              value={question.hint ?? ""}
              onChange={(event) => patchQuestion({ hint: event.target.value })}
              className="mt-1 w-full rounded-control bg-paper-2 px-3 py-2 text-ink outline-none ring-1 ring-ink/10"
            />
          </label>
          <label className="mt-3 block text-sm text-ink-soft">
            Ảnh câu hỏi, tối đa 180KB
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (file.size > 180_000) {
                  setError("Ảnh lớn hơn 180KB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => patchQuestion({ image: String(reader.result ?? "") });
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {question.image && (
            <button type="button" className="mt-2 text-sm text-stamp" onClick={() => patchQuestion({ image: undefined })}>
              Gỡ ảnh
            </button>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="min-h-11 rounded-control bg-ink px-4 text-sm font-semibold text-paper"
              onClick={() => {
                const issue = questionIssues(question);
                if (issue) {
                  setError(issue);
                  return;
                }
                setError("");
                setPreviewSeed((seed) => seed + 1);
                setPreviewOn(true);
              }}
            >
              Xem thử câu này
            </button>
            <button type="button" className="min-h-11 text-sm text-stamp" onClick={() => deleteQuiz(draft.id)}>
              Xóa cả đề
            </button>
          </div>
          {previewOn && <Preview question={question} seed={previewSeed} />}
        </div>
      </div>
    </Shell>
  );
}

function Preview({ question, seed }: { question: Question; seed: number }) {
  const [done, setDone] = useState<ReturnType<typeof grade> | null>(null);
  return (
    <div className="mt-4 border-t border-ink/10 pt-4">
      <QuestionBoard
        key={seed}
        question={question}
        seed={seed}
        disabled={Boolean(done)}
        verdict={done}
        onSubmit={(payload) =>
          setDone(
            grade(question, payload, {
              elapsed: 1,
              timeLimit: question.timeLimit || 20,
              streak: 0,
              hintUsed: false,
              hintPenalty: false,
            }),
          )
        }
      />
      {done && <p className="mt-3 text-sm">Đáp án: {done.answer}</p>}
    </div>
  );
}

function TypeFields({ question, onChange }: { question: Question; onChange: (partial: Partial<Question>) => void }) {
  if (question.type === "mc" || question.type === "image" || question.type === "poll") {
    const choices = question.choices ?? [];
    return (
      <div className="mt-4 grid gap-2">
        {choices.map((choice, index) => (
          <div key={choice.id} className="flex items-center gap-2">
            {question.type !== "poll" && (
              <input
                type="checkbox"
                checked={question.correctIds?.includes(choice.id) ?? false}
                onChange={(event) => {
                  const curr = new Set(question.correctIds ?? []);
                  if (event.target.checked) curr.add(choice.id);
                  else curr.delete(choice.id);
                  onChange({ correctIds: [...curr] });
                }}
                aria-label="Đáp án đúng"
              />
            )}
            <input
              value={choice.text}
              onChange={(event) => {
                const next = choices.map((item) => (item.id === choice.id ? { ...item, text: event.target.value } : item));
                onChange({ choices: next });
              }}
              className="min-h-11 flex-1 rounded-control bg-paper-2 px-3 text-ink outline-none"
            />
            {question.type === "poll" && (
              <input
                type="number"
                className="w-16 rounded-control bg-paper-2 px-2 py-2 text-ink"
                value={question.pollWeights?.[choice.id] ?? 10}
                onChange={(event) =>
                  onChange({ pollWeights: { ...question.pollWeights, [choice.id]: Number(event.target.value) } })
                }
              />
            )}
            <button
              type="button"
              className="text-sm text-stamp"
              disabled={choices.length <= 2}
              onClick={() => onChange({ choices: choices.filter((item) => item.id !== choice.id) })}
            >
              Xóa {index + 1}
            </button>
          </div>
        ))}
        {choices.length < 6 && (
          <button
            type="button"
            className="min-h-11 text-left text-sm text-ink-soft"
            onClick={() => onChange({ choices: [...choices, { id: uid("c"), text: "Phương án mới", mark: "seal" }] })}
          >
            Thêm phương án
          </button>
        )}
        {question.type !== "poll" && <p className="text-xs text-ink-soft">Tick các ô là đáp án đúng. Một ô là chọn một, nhiều ô là chọn nhiều.</p>}
      </div>
    );
  }
  if (question.type === "tf") {
    return (
      <div className="mt-4 flex gap-2">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => onChange({ tf: value })}
            className={question.tf === value ? "min-h-11 rounded-control bg-ink px-4 text-paper" : "min-h-11 rounded-control bg-paper-2 px-4 text-ink"}
          >
            {value ? "Đúng" : "Sai"}
          </button>
        ))}
      </div>
    );
  }
  if (question.type === "fill") {
    const accepted = question.accepted ?? [""];
    return (
      <div className="mt-4 grid gap-2">
        {accepted.map((value, index) => (
          <input
            key={index}
            value={value}
            onChange={(event) => {
              const next = [...accepted];
              next[index] = event.target.value;
              onChange({ accepted: next });
            }}
            className="min-h-11 rounded-control bg-paper-2 px-3 text-ink outline-none"
            placeholder="Đáp án chấp nhận"
          />
        ))}
        <button type="button" className="text-left text-sm text-ink-soft" onClick={() => onChange({ accepted: [...accepted, ""] })}>
          Thêm cách viết khác
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={question.caseSensitive === true}
            onChange={(event) => onChange({ caseSensitive: event.target.checked })}
          />
          Phân biệt hoa thường
        </label>
      </div>
    );
  }
  if (question.type === "order" || question.type === "sort") {
    const items = question.items ?? [];
    return (
      <div className="mt-4 grid gap-2">
        <p className="text-xs text-ink-soft">
          {question.type === "order" ? "Thứ tự từ trên xuống là thứ tự đúng." : "Mỗi thẻ thuộc một nhóm."}
        </p>
        {items.map((item) => (
          <div key={item.id} className="flex gap-2">
            <input
              value={item.text}
              onChange={(event) =>
                onChange({ items: items.map((row) => (row.id === item.id ? { ...row, text: event.target.value } : row)) })
              }
              className="min-h-11 flex-1 rounded-control bg-paper-2 px-3 text-ink outline-none"
            />
            {question.type === "sort" && (
              <select
                value={question.bins?.find((bin) => bin.itemIds.includes(item.id))?.id ?? ""}
                onChange={(event) => {
                  const bins = (question.bins ?? []).map((bin) => ({
                    ...bin,
                    itemIds: bin.itemIds.filter((id) => id !== item.id),
                  }));
                  const target = bins.find((bin) => bin.id === event.target.value);
                  if (target) target.itemIds = [...target.itemIds, item.id];
                  onChange({ bins });
                }}
                className="rounded-control bg-paper-2 px-2 text-ink"
              >
                {(question.bins ?? []).map((bin) => (
                  <option key={bin.id} value={bin.id}>
                    {bin.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
        {question.type === "sort" &&
          (question.bins ?? []).map((bin) => (
            <input
              key={bin.id}
              value={bin.label}
              onChange={(event) =>
                onChange({
                  bins: (question.bins ?? []).map((row) => (row.id === bin.id ? { ...row, label: event.target.value } : row)),
                })
              }
              className="min-h-11 rounded-control bg-paper-2 px-3 text-ink outline-none"
            />
          ))}
      </div>
    );
  }
  if (question.type === "match") {
    const pairs = question.pairs ?? [];
    return (
      <div className="mt-4 grid gap-2">
        {pairs.map((pair) => (
          <div key={pair.id} className="grid gap-2 sm:grid-cols-2">
            <input
              value={pair.left}
              onChange={(event) =>
                onChange({ pairs: pairs.map((row) => (row.id === pair.id ? { ...row, left: event.target.value } : row)) })
              }
              className="min-h-11 rounded-control bg-paper-2 px-3 text-ink outline-none"
            />
            <input
              value={pair.right}
              onChange={(event) =>
                onChange({ pairs: pairs.map((row) => (row.id === pair.id ? { ...row, right: event.target.value } : row)) })
              }
              className="min-h-11 rounded-control bg-paper-2 px-3 text-ink outline-none"
            />
          </div>
        ))}
      </div>
    );
  }
  if (question.type === "hotspot") {
    return (
      <div className="mt-4 grid gap-2">
        {(question.hotspots ?? []).map((spot) => (
          <label key={spot.id} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="hot"
              checked={question.correctHotspot === spot.id}
              onChange={() => onChange({ correctHotspot: spot.id })}
            />
            <input
              value={spot.label}
              onChange={(event) =>
                onChange({
                  hotspots: (question.hotspots ?? []).map((row) => (row.id === spot.id ? { ...row, label: event.target.value } : row)),
                })
              }
              className="min-h-11 flex-1 rounded-control bg-paper-2 px-3 text-ink outline-none"
            />
          </label>
        ))}
      </div>
    );
  }
  const rubric = question.rubric ?? [];
  return (
    <div className="mt-4 grid gap-2">
      {rubric.map((line, index) => (
        <input
          key={index}
          value={line}
          onChange={(event) => {
            const next = [...rubric];
            next[index] = event.target.value;
            onChange({ rubric: next });
          }}
          className="min-h-11 rounded-control bg-paper-2 px-3 text-ink outline-none"
        />
      ))}
      <button type="button" className="text-left text-sm text-ink-soft" onClick={() => onChange({ rubric: [...rubric, "Ý mới"] })}>
        Thêm ý đáp án
      </button>
    </div>
  );
}
