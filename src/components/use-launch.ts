import { useNavigate } from "@tanstack/react-router";
import { findQuiz } from "@/game/quizzes";
import { useGame } from "@/game/store";
import type { Mode } from "@/game/types";

export function useLaunch() {
  const navigate = useNavigate();
  return (quizId: string, mode: Mode) => {
    const quiz = findQuiz(useGame.getState().custom, quizId);
    if (!quiz) return;
    useGame.getState().startRun(quiz, mode);
    void navigate({ to: "/play", search: { quiz: quizId, mode } });
  };
}
