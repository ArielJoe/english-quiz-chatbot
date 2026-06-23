"use client";

import type { QuizAnswerResult } from "@/types/quiz";

interface FeedbackScreenProps {
  isLastQuestion: boolean;
  onNext: () => void;
  result: QuizAnswerResult;
}

const correctGifs = [
  "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif",
  "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif"
];

const wrongGifs = [
  "https://media.giphy.com/media/3oEjI80DSa1grNPTDq/giphy.gif",
  "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3o7TKVfu4rwyscasla/giphy.gif"
];

function hashText(value: string): number {
  return value.split("").reduce((total, character) => {
    return total + character.charCodeAt(0);
  }, 0);
}

function getFeedbackGif(result: QuizAnswerResult): string {
  const pool = result.isCorrect ? correctGifs : wrongGifs;
  const seed = `${result.question.id}-${result.userAnswer}-${result.isCorrect}`;

  return pool[hashText(seed) % pool.length];
}

export function FeedbackScreen({
  isLastQuestion,
  onNext,
  result
}: FeedbackScreenProps) {
  const { question, userAnswer, isCorrect } = result;
  const feedbackGif = getFeedbackGif(result);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-lg border p-4 ${
          isCorrect
            ? "border-green-200 bg-green-50 text-green-950"
            : "border-red-200 bg-red-50 text-red-950"
        }`}
      >
        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- External GIFs should stay animated. */}
          <img
            src={feedbackGif}
            alt={isCorrect ? "GIF jawaban benar" : "GIF jawaban salah"}
            className="aspect-video w-full rounded-md object-cover"
          />
          <div className="grid gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em]">
                {isCorrect ? "Benar" : "Salah"}
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {isCorrect
                  ? "Yes, ini masuk. Lanjut gas."
                  : "Belum kena. Tapi polanya mulai kebaca."}
              </h2>
            </div>

            <div className="grid gap-1 text-sm leading-6">
              <p>
                <span className="font-semibold">Kamu jawab:</span>{" "}
                {userAnswer}
              </p>
              <p>
                <span className="font-semibold">Yang tepat:</span>{" "}
                {question.correct_answer}
              </p>
              <p>
                <span className="font-semibold">Kenapa:</span>{" "}
                {question.explanation}
              </p>
              <p>
                <span className="font-semibold">Kalau mau nguatkan:</span>{" "}
                {question.material_recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto"
        onClick={onNext}
      >
        {isLastQuestion ? "Lihat hasilnya" : "Lanjut soal berikutnya"}
      </button>
    </div>
  );
}
