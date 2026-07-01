"use client";

import { useEffect } from "react";

import type { Question } from "@/types/quiz";

interface QuizScreenProps {
  answer: string;
  onAnswerChange: (answer: string) => void;
  onAskClue: () => void;
  onSubmit: () => void;
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  isSubmitting?: boolean;
}

export function QuizScreen({
  answer,
  onAnswerChange,
  onAskClue,
  onSubmit,
  question,
  questionIndex,
  totalQuestions,
  isSubmitting = false
}: QuizScreenProps) {
  const progressPercentage = ((questionIndex + 1) / totalQuestions) * 100;
  const canSubmit = answer.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isSubmitting) return;

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
  }, [canSubmit, onAnswerChange, onSubmit, question, isSubmitting]);

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
            className="h-full rounded-full bg-brand-500 transition-all"
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
          {question.options.map((option, index) => (
            <button
              key={`${index}-${option}`}
              type="button"
              disabled={isSubmitting}
              className={`min-h-16 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold leading-relaxed transition ${
                answer === option
                  ? "border-brand-500 bg-brand-50 text-brand-900"
                  : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
              } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={() => onAnswerChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Tulis jawaban Anda
          <input
            className="rounded-xl border-2 border-slate-200 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Ketik jawaban di sini"
            value={answer}
            disabled={isSubmitting}
            onChange={(event) => onAnswerChange(event.target.value)}
          />
        </label>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? "Menilai..." : "Cek jawaban"}
        </button>
        <button
          type="button"
          className="btn-secondary w-full sm:w-auto"
          disabled={isSubmitting}
          onClick={onAskClue}
        >
          Minta clue ke Lingo
        </button>
      </div>
    </div>
  );
}
