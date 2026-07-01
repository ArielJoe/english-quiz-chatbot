import type { Question } from "@/types/quiz";

export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Jarak edit Levenshtein antara dua string.
 * Disimpan di sini untuk menghindari circular dependency dengan lib/typo.ts.
 */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const row = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i += 1) {
    let prev = row[0];
    row[0] = i;

    for (let j = 1; j <= n; j += 1) {
      const tmp = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }

  return row[n];
}

/**
 * Batas maksimum jarak edit yang masih dianggap typo.
 * Kata sangat pendek (≤ 3 huruf) tidak ditoleransi karena
 * satu huruf beda sudah bisa menjadi kata yang berbeda.
 */
function typoThreshold(answerLength: number): number {
  if (answerLength <= 3) return 0;
  if (answerLength <= 6) return 1;
  return 2;
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
  const normalizedUser = normalizeAnswer(userAnswer);

  // Lapis 1: exact match setelah normalisasi.
  const exactMatch = question.acceptable_answers.some(
    (answer) => normalizeAnswer(answer) === normalizedUser
  );

  if (exactMatch) return true;

  // Lapis 2: toleransi typo menggunakan jarak edit Levenshtein.
  return question.acceptable_answers.some((answer) => {
    const normalizedAnswer = normalizeAnswer(answer);
    const maxAllowed = typoThreshold(normalizedAnswer.length);

    // Jangan toleransi typo jika threshold-nya 0 (kata terlalu pendek).
    if (maxAllowed === 0) return false;

    return editDistance(normalizedUser, normalizedAnswer) <= maxAllowed;
  });
}

export function gradeAnswer(question: Question, userAnswer: string): boolean {
  if (question.type === "multiple_choice") {
    return gradeMultipleChoice(question, userAnswer);
  }

  return gradeFillInBlank(question, userAnswer);
}
