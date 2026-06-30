"use client";

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

interface QuizSetupProps {
  config: QuizGenerationRequest;
  error: string;
  isLoading: boolean;
  onChange: (config: QuizGenerationRequest) => void;
  onStart: (config: QuizGenerationRequest) => void;
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
          Apa yang ingin Anda latih hari ini?
        </h2>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-slate-800">
          Pilih level
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                config.level === level
                  ? "border-brand-500 bg-brand-50 text-brand-900"
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
          Pilih topik
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SUBTOPICS.map((subtopic) => (
            <button
              key={subtopic}
              type="button"
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                config.subtopic === subtopic
                  ? "border-brand-500 bg-brand-50 text-brand-900"
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
          Tipe soal
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {QUIZ_REQUEST_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                config.type === type
                  ? "border-brand-500 bg-brand-50 text-brand-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => onChange({ ...config, type })}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="button"
        className="btn-primary w-full sm:w-auto"
        disabled={isLoading}
        onClick={() => onStart(config)}
      >
        {isLoading ? "Menyiapkan soal..." : "Mulai latihan"}
      </button>
    </div>
  );
}
