import { uid } from "@/game/engine";
import type { QType, Question, Quiz } from "@/game/types";

export function blankQuestion(type: QType): Question {
  const id = uid("q");
  const base: Question = {
    id,
    type,
    prompt: "Câu hỏi mới",
    timeLimit: type === "rubric" ? 0 : 25,
    points: 800,
  };
  if (type === "mc" || type === "poll" || type === "image") {
    base.choices =
      type === "image"
        ? [
            { id: uid("c"), text: "Dấu", mark: "seal" },
            { id: uid("c"), text: "Sách", mark: "book" },
            { id: uid("c"), text: "La bàn", mark: "compass" },
            { id: uid("c"), text: "Lá", mark: "leaf" },
          ]
        : [
            { id: uid("c"), text: "Phương án A" },
            { id: uid("c"), text: "Phương án B" },
            { id: uid("c"), text: "Phương án C" },
            { id: uid("c"), text: "Phương án D" },
          ];
    if (type !== "poll") base.correctIds = [base.choices[0]!.id];
    if (type === "poll") base.pollWeights = Object.fromEntries(base.choices.map((c) => [c.id, 10]));
  }
  if (type === "tf") base.tf = true;
  if (type === "fill") base.accepted = ["đáp án"];
  if (type === "order") {
    base.items = [
      { id: uid("i"), text: "Bước một" },
      { id: uid("i"), text: "Bước hai" },
      { id: uid("i"), text: "Bước ba" },
    ];
  }
  if (type === "match") {
    base.pairs = [
      { id: uid("p"), left: "Vế trái 1", right: "Vế phải 1" },
      { id: uid("p"), left: "Vế trái 2", right: "Vế phải 2" },
    ];
  }
  if (type === "sort") {
    const a = uid("i");
    const b = uid("i");
    base.items = [
      { id: a, text: "Thẻ A" },
      { id: b, text: "Thẻ B" },
    ];
    base.bins = [
      { id: uid("b"), label: "Nhóm A", itemIds: [a] },
      { id: uid("b"), label: "Nhóm B", itemIds: [b] },
    ];
  }
  if (type === "hotspot") {
    base.hotspots = [
      { id: "h1", x: 4, y: 8, w: 44, h: 38, label: "Ô 1" },
      { id: "h2", x: 52, y: 8, w: 44, h: 38, label: "Ô 2" },
      { id: "h3", x: 4, y: 54, w: 44, h: 38, label: "Ô 3" },
      { id: "h4", x: 52, y: 54, w: 44, h: 38, label: "Ô 4" },
    ];
    base.correctHotspot = "h1";
  }
  if (type === "rubric") base.rubric = ["Ý đúng cần có"];
  return base;
}

export function blankQuiz(): Quiz {
  return {
    id: uid("quiz"),
    title: "Đề mới",
    description: "",
    category: "Tự soạn",
    difficulty: "medium",
    questions: [blankQuestion("mc")],
  };
}
