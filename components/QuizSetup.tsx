"use client";

import { useState } from "react";

import {
  LEVELS,
  QUIZ_REQUEST_TYPES,
  SUBTOPICS,
  type Level,
  type QuizGenerationRequest,
  type QuizRequestType,
  type Subtopic
} from "@/types/quiz";

const levelLabels: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

const subtopicLabels: Record<Subtopic, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  translation: "Translation",
  conversation: "Conversation"
};

const typeLabels: Record<QuizRequestType, string> = {
  multiple_choice: "Multiple Choice",
  fill_in_blank: "Fill in the Blank",
  mixed: "Campuran"
};

const countOptions = [5, 10] as const;

interface QuizSetupProps {
  config: QuizGenerationRequest;
  error: string;
  isLoading: boolean;
  onChange: (config: QuizGenerationRequest) => void;
  onStart: (config: QuizGenerationRequest) => void;
}

interface QuestionCountPickerProps {
  count: number;
  onChange: (count: number) => void;
}

function QuestionCountPicker({ count, onChange }: QuestionCountPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative grid max-w-xs gap-2 text-sm font-semibold text-slate-800"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <span>Mau berapa soal?</span>
      <button
        type="button"
        className="flex items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-slate-950 outline-none transition hover:border-slate-500 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{count} soal</span>
        <span className="text-xs text-slate-500">{isOpen ? "^" : "v"}</span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-10 mt-2 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
          role="listbox"
        >
          {countOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`block w-full px-3 py-2 text-left text-sm transition ${
                count === option
                  ? "bg-slate-950 font-bold text-white"
                  : "text-slate-800 hover:bg-slate-100"
              }`}
              role="option"
              aria-selected={count === option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option} soal
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuizSetup({
  config,
  error,
  isLoading,
  onChange,
  onStart
}: QuizSetupProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-950">
          Mau latihan apa hari ini?
        </h2>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-slate-800">
          Mulai dari level mana?
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                config.level === level
                  ? "border-teal-600 bg-teal-50 text-teal-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => onChange({ ...config, level })}
            >
              {levelLabels[level]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-slate-800">
          Topik yang mau dilatih
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SUBTOPICS.map((subtopic) => (
            <button
              key={subtopic}
              type="button"
              className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                config.subtopic === subtopic
                  ? "border-sky-600 bg-sky-50 text-sky-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => onChange({ ...config, subtopic })}
            >
              {subtopicLabels[subtopic]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-slate-800">
          Model soalnya
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {QUIZ_REQUEST_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                config.type === type
                  ? "border-amber-500 bg-amber-50 text-amber-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => onChange({ ...config, type })}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </fieldset>

      <QuestionCountPicker
        count={config.count}
        onChange={(count) => onChange({ ...config, count })}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="button"
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        disabled={isLoading}
        onClick={() => onStart(config)}
      >
        {isLoading ? "Sebentar, lagi nyiapin soal..." : "Mulai latihan"}
      </button>
    </div>
  );
}
