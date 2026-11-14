import type { Question } from "@/types/quiz";

export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Jarak edit Damerau-Levenshtein (optimal string alignment) antara dua string.
 * Pertukaran dua huruf bersebelahan ("teh" -> "the") dihitung 1 kesalahan.
 * Disimpan di sini untuk menghindari circular dependency dengan lib/typo.ts.
 */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[m][n];
}

function sortLetters(value: string): string {
  return [...value].sort().join("");
}

// Akhiran infleksi: beda di sini biasanya kesalahan grammar, bukan salah ketik.
const INFLECTION_SUFFIXES = ["s", "es", "ed", "d", "ing", "er", "est", "ly"];

function differsOnlyByInflection(a: string, b: string): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];

  return (
    longer.startsWith(shorter) &&
    INFLECTION_SUFFIXES.includes(longer.slice(shorter.length))
  );
}

/**
 * Apakah jawaban pengguna cukup dekat dengan jawaban benar untuk dianggap typo.
 * - 1-2 huruf: harus persis.
 * - 3-4 huruf: hanya pertukaran huruf ("teh" -> "the"), karena ganti satu huruf
 *   sudah bisa menjadi kata lain ("went" -> "want").
 * - 5-7 huruf: maksimal 1 kesalahan.
 * - 8+ huruf: maksimal 2 kesalahan.
 * Beda akhiran infleksi ("drink" vs "drinks") tidak pernah dianggap typo.
 */
export function isMinorTypo(userAnswer: string, correctAnswer: string): boolean {
  const user = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);

  if (!user || !correct || user === correct) return false;
  if (correct.length <= 2) return false;
  if (differsOnlyByInflection(user, correct)) return false;

  const distance = editDistance(user, correct);

  if (correct.length <= 4) {
    return (
      distance === 1 &&
      user.length === correct.length &&
      sortLetters(user) === sortLetters(correct)
    );
  }
  if (correct.length <= 7) return distance <= 1;
  return distance <= 2;
}

export interface GradeResult {
  isCorrect: boolean;
  /** Jawaban benar yang dimaksud jika diterima karena typo kecil. */
  typoOf?: string;
}

export function gradeMultipleChoice(
  question: Question,
  userAnswer: string
): boolean {
  return userAnswer === question.correct_answer;
}

function fillInBlankCandidates(question: Question): string[] {
  return [question.correct_answer, ...question.acceptable_answers].filter(
    (answer) => answer.trim().length > 0
  );
}

export function gradeFillInBlankDetailed(
  question: Question,
  userAnswer: string
): GradeResult {
  const normalizedUser = normalizeAnswer(userAnswer);
  const candidates = fillInBlankCandidates(question);

  // Lapis 1: exact match setelah normalisasi.
  if (candidates.some((answer) => normalizeAnswer(answer) === normalizedUser)) {
    return { isCorrect: true };
  }

  // Lapis 2: toleransi typo kecil.
  const typoOf = candidates.find((answer) => isMinorTypo(userAnswer, answer));

  return typoOf ? { isCorrect: true, typoOf: typoOf.trim() } : { isCorrect: false };
}

export function gradeFillInBlank(
  question: Question,
  userAnswer: string
): boolean {
  return gradeFillInBlankDetailed(question, userAnswer).isCorrect;
}

export function gradeAnswerDetailed(
  question: Question,
  userAnswer: string
): GradeResult {
  if (question.type === "multiple_choice") {
    return { isCorrect: gradeMultipleChoice(question, userAnswer) };
  }

  return gradeFillInBlankDetailed(question, userAnswer);
}

export function gradeAnswer(question: Question, userAnswer: string): boolean {
  if (question.type === "multiple_choice") {
    return gradeMultipleChoice(question, userAnswer);
  }

  return gradeFillInBlank(question, userAnswer);
}
