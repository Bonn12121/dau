import type { Quiz } from "@/game/types";
import { englishQuiz } from "@/game/quizzes/english";
import { gdcdQuiz, gdcdFullBankQuiz } from "@/game/quizzes/gdcd";
import { SAMPLE_QUIZZES } from "@/game/quizzes/samples";
import { diaQuiz, suDiaEssayQuiz, suQuiz } from "@/game/quizzes/su-dia";

export { englishQuiz } from "@/game/quizzes/english";

export const BUILTINS: Quiz[] = [
  englishQuiz,
  suQuiz,
  diaQuiz,
  gdcdFullBankQuiz,
  suDiaEssayQuiz,
  gdcdQuiz,
  ...SAMPLE_QUIZZES,
];

export function allQuizzes(custom: Quiz[]) {
  const ids = new Set(BUILTINS.map((q) => q.id));
  return [...BUILTINS, ...custom.filter((q) => !ids.has(q.id))];
}

export function findQuiz(custom: Quiz[], id: string) {
  return allQuizzes(custom).find((q) => q.id === id);
}
