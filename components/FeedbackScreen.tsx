"use client";

import { useEffect, useState } from "react";

import type { QuizAnswerResult } from "@/types/quiz";

interface FeedbackScreenProps {
  isLastQuestion: boolean;
  onNext: () => void;
  result: QuizAnswerResult;
}

// Cadangan tampil instan sebelum GIF acak dari online selesai dimuat.
const correctFallback = [
  "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif",
  "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
];

const wrongFallback = [
  "https://media.giphy.com/media/3oEjI80DSa1grNPTDq/giphy.gif",
  "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3o7TKVfu4rwyscasla/giphy.gif",
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function FeedbackScreen({
  isLastQuestion,
  onNext,
  result
}: FeedbackScreenProps) {
  const { question, userAnswer, isCorrect } = result;
  const [gifUrl, setGifUrl] = useState(() =>
    pickRandom(isCorrect ? correctFallback : wrongFallback)
  );

  // Ambil GIF acak dari online sesuai hasil (benar/salah).
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    fetch(`/api/feedback-gif?result=${isCorrect ? "correct" : "wrong"}`, {
      cache: "no-store",
      signal: controller.signal
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { url?: string } | null) => {
        if (active && data?.url) {
          setGifUrl(data.url);
        }
      })
      .catch(() => {
        // Tetap pakai cadangan jika gagal.
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [isCorrect]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-2xl border-2 p-4 ${
          isCorrect
            ? "border-brand-200 bg-brand-50 text-brand-900"
            : "border-red-200 bg-red-50 text-red-950"
        }`}
      >
        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- GIF eksternal perlu tetap beranimasi. */}
          <img
            src={gifUrl}
            alt={isCorrect ? "GIF jawaban benar" : "GIF jawaban salah"}
            className="aspect-video w-full rounded-xl object-cover"
          />
          <div className="grid gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em]">
                {isCorrect ? "Benar" : "Belum tepat"}
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {isCorrect
                  ? "Tepat! Jawaban Anda sudah benar."
                  : "Belum tepat, tetapi Anda sudah di jalur yang benar."}
              </h2>
            </div>

            <div className="grid gap-1 text-sm leading-6">
              <p>
                <span className="font-semibold">Jawaban Anda:</span>{" "}
                {userAnswer}
              </p>
              <p>
                <span className="font-semibold">Jawaban tepat:</span>{" "}
                {question.correct_answer}
              </p>
              <p>
                <span className="font-semibold">Penjelasan:</span>{" "}
                {question.explanation}
              </p>
              <p>
                <span className="font-semibold">Saran latihan:</span>{" "}
                {question.material_recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary w-full sm:w-auto"
        onClick={onNext}
      >
        {isLastQuestion ? "Lihat hasil" : "Lanjut ke soal berikutnya"}
      </button>
    </div>
  );
}
