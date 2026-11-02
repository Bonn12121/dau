import type { Quiz } from "@/game/types";
import { gdcdQuiz, gdcdFullBankQuiz } from "@/game/quizzes/gdcd";
import { SAMPLE_QUIZZES } from "@/game/quizzes/samples";

export const BUILTINS: Quiz[] = [gdcdFullBankQuiz, gdcdQuiz, ...SAMPLE_QUIZZES];

export function allQuizzes(custom: Quiz[]) {
  const ids = new Set(BUILTINS.map((q) => q.id));
  return [...BUILTINS, ...custom.filter((q) => !ids.has(q.id))];
}

export function findQuiz(custom: Quiz[], id: string) {
  return allQuizzes(custom).find((q) => q.id === id);
}
