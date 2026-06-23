"use client";

import { useMemo, useState } from "react";

import type { Quiz, QuizAnswerResult } from "@/types/quiz";

interface SummaryScreenProps {
  onNewQuiz: () => void;
  onRetry: () => void;
  quiz: Quiz;
  results: QuizAnswerResult[];
}

function getWeaknessSummary(results: QuizAnswerResult[]): string[] {
  const counts = new Map<string, number>();

  for (const result of results) {
    if (!result.isCorrect) {
      counts.set(
        result.question.skill_tag,
        (counts.get(result.question.skill_tag) ?? 0) + 1
      );
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([skill, count]) => `${skill.replace(/_/g, " ")} (${count} salah)`);
}

interface SkillStat {
  skill: string;
  total: number;
  correct: number;
  wrong: number;
}

function getSkillStats(results: QuizAnswerResult[]): SkillStat[] {
  const stats = new Map<string, SkillStat>();

  for (const result of results) {
    const skill = result.question.skill_tag;
    const current = stats.get(skill) ?? {
      skill,
      total: 0,
      correct: 0,
      wrong: 0,
    };

    current.total += 1;

    if (result.isCorrect) {
      current.correct += 1;
    } else {
      current.wrong += 1;
    }

    stats.set(skill, current);
  }

  return [...stats.values()].sort((a, b) => b.wrong - a.wrong);
}

function getRecommendations(results: QuizAnswerResult[]): string[] {
  const source = results.some((result) => !result.isCorrect)
    ? results.filter((result) => !result.isCorrect)
    : results;

  return [
    ...new Set(
      source.map((result) => result.question.material_recommendation.trim())
    )
  ].filter(Boolean);
}

export function SummaryScreen({
  onNewQuiz,
  onRetry,
  quiz,
  results
}: SummaryScreenProps) {
  const correctCount = results.filter((result) => result.isCorrect).length;
  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const weaknesses = useMemo(() => getWeaknessSummary(results), [results]);
  const recommendations = useMemo(() => getRecommendations(results), [results]);
  const skillStats = useMemo(() => getSkillStats(results), [results]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Hasil Latihan
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Skor kamu {score}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Kamu benar {correctCount} dari {quiz.questions.length} soal.
        </p>
      </div>

      <div className="grid gap-3">
        {results.map((result, index) => (
          <div
            key={result.question.id}
            className="rounded-md border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">
                {index + 1}. {result.question.question}
              </p>
              <span
                className={`rounded-md px-2 py-1 text-xs font-bold uppercase ${
                  result.isCorrect
                    ? "bg-teal-100 text-teal-900"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {result.isCorrect ? "Benar" : "Salah"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Yang tepat: {result.question.correct_answer}
            </p>
            {openReviewId === result.question.id && (
              <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <p>
                  <span className="font-semibold text-slate-950">
                    Kamu jawab:
                  </span>{" "}
                  {result.userAnswer}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-slate-950">
                    Kenapa:
                  </span>{" "}
                  {result.question.explanation}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-slate-950">
                    Latihan lanjut:
                  </span>{" "}
                  {result.question.material_recommendation}
                </p>
              </div>
            )}
            <button
              type="button"
              className="mt-3 text-sm font-bold text-slate-950 underline-offset-4 hover:underline"
              onClick={() =>
                setOpenReviewId((currentId) =>
                  currentId === result.question.id ? null : result.question.id
                )
              }
            >
              {openReviewId === result.question.id
                ? "Tutup review"
                : "Lihat review"}
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-950">
            Bagian yang perlu dilatih
          </h3>
          {weaknesses.length > 0 ? (
            <ul className="mt-3 grid gap-2 text-sm text-slate-700">
              {weaknesses.map((weakness) => (
                <li key={weakness}>{weakness}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-700">
              Rapi banget. Di sesi ini belum ada bagian yang perlu disorot.
            </p>
          )}
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-950">
            Peta kecil kemampuanmu
          </h3>
          <div className="mt-3 grid gap-3">
            {skillStats.map((stat) => {
              const correctPercentage =
                stat.total === 0 ? 0 : Math.round((stat.correct / stat.total) * 100);

              return (
                <div key={stat.skill} className="grid gap-1">
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {stat.skill.replace(/_/g, " ")}
                    </span>
                    <span>
                      {stat.correct}/{stat.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-red-100">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${correctPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-sky-200 bg-sky-50 p-4 md:col-span-2">
          <h3 className="text-sm font-bold text-sky-950">
            Latihan berikutnya
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-sky-900">
            {recommendations.slice(0, 4).map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
          onClick={onRetry}
        >
          Coba lagi
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          onClick={onNewQuiz}
        >
          Pilih kuis lain
        </button>
      </div>
    </div>
  );
}
