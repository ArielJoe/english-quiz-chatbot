import { normalizeAnswer } from "@/lib/grading";

/** Jarak edit Levenshtein antara dua string. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const distances = Array.from({ length: n + 1 }, (_, index) => index);

  for (let i = 1; i <= m; i += 1) {
    let previous = distances[0];
    distances[0] = i;

    for (let j = 1; j <= n; j += 1) {
      const temp = distances[j];
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      distances[j] = Math.min(
        distances[j] + 1,
        distances[j - 1] + 1,
        previous + substitutionCost
      );
      previous = temp;
    }
  }

  return distances[n];
}

/**
 * Mengembalikan kandidat jawaban yang paling mirip jika input terlihat seperti
 * salah ketik (typo) dari salah satu jawaban yang dapat diterima. Hanya memicu
 * untuk kemiripan tinggi (jarak edit kecil), sehingga jawaban yang benar-benar
 * berbeda tidak ikut "dibetulkan" dan jawaban tidak terbocorkan.
 */
export function findTypoSuggestion(
  input: string,
  candidates: string[]
): string | null {
  const normalizedInput = normalizeAnswer(input);

  if (normalizedInput.length < 2) {
    return null;
  }

  let best: { display: string; distance: number } | null = null;

  for (const candidate of candidates) {
    const display = candidate.trim();
    const normalizedCandidate = normalizeAnswer(candidate);

    if (!display || !normalizedCandidate) {
      continue;
    }

    // Sudah cocok persis dengan salah satu jawaban — bukan typo.
    if (normalizedCandidate === normalizedInput) {
      return null;
    }

    const distance = levenshtein(normalizedInput, normalizedCandidate);

    if (!best || distance < best.distance) {
      best = { display, distance };
    }
  }

  if (!best) {
    return null;
  }

  const targetLength = normalizeAnswer(best.display).length;
  const maxDistance = targetLength <= 4 ? 1 : 2;

  return best.distance >= 1 && best.distance <= maxDistance
    ? best.display
    : null;
}
