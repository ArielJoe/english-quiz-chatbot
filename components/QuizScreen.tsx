"use client";

import { useEffect } from "react";

import type { Question } from "@/types/quiz";

interface QuizScreenProps {
  answer: string;
  onAnswerChange: (answer: string) => void;
  onReplaceQuestion: () => void;
  onSubmit: () => void;
  question: Question;
  questionIndex: number;
  totalQuestions: number;
}

export function QuizScreen({
  answer,
  onAnswerChange,
  onReplaceQuestion,
  onSubmit,
  question,
  questionIndex,
  totalQuestions
}: QuizScreenProps) {
  const progressPercentage = ((questionIndex + 1) / totalQuestions) * 100;
  const canSubmit = answer.trim().length > 0;
  const canReplaceQuestion = questionIndex < totalQuestions - 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isInputTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (question.type === "multiple_choice" && !isInputTarget) {
        const optionIndex = Number(event.key) - 1;

        if (optionIndex >= 0 && optionIndex < question.options.length) {
          event.preventDefault();
          onAnswerChange(question.options[optionIndex]);
          return;
        }
      }

      if (event.key === "Enter" && canSubmit) {
        event.preventDefault();
        onSubmit();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canSubmit, onAnswerChange, onSubmit, question]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">
            Nomor {questionIndex + 1} dari {totalQuestions}
          </p>
          <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
            {question.skill_tag.replace(/_/g, " ")}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-lg font-semibold leading-relaxed text-slate-950">
          {question.question}
        </p>
      </div>

      {question.type === "multiple_choice" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              className={`min-h-16 rounded-md border px-4 py-3 text-left text-sm font-semibold leading-relaxed transition ${
                answer === option
                  ? "border-teal-600 bg-teal-50 text-teal-950"
                  : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
              }`}
              onClick={() => onAnswerChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Tulis jawabanmu
          <input
            className="rounded-md border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            placeholder="Ketik di sini"
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
          />
        </label>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          Cek jawaban
        </button>
        <button
          type="button"
          className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 sm:w-auto"
          disabled={!canReplaceQuestion}
          onClick={onReplaceQuestion}
        >
          Ganti soal
        </button>
      </div>
    </div>
  );
}
