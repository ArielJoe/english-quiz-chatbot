import type { Question } from "@/types/quiz";

export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

export function gradeMultipleChoice(
  question: Question,
  userAnswer: string
): boolean {
  return userAnswer === question.correct_answer;
}

export function gradeFillInBlank(
  question: Question,
  userAnswer: string
): boolean {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);

  return question.acceptable_answers.some((answer) => {
    return normalizeAnswer(answer) === normalizedUserAnswer;
  });
}

export function gradeAnswer(question: Question, userAnswer: string): boolean {
  if (question.type === "multiple_choice") {
    return gradeMultipleChoice(question, userAnswer);
  }

  return gradeFillInBlank(question, userAnswer);
}
