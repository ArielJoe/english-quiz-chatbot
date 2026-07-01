import { editDistance, normalizeAnswer } from "@/lib/grading";

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

    const distance = editDistance(normalizedInput, normalizedCandidate);

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
