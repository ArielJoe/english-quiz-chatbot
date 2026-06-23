"use client";

import { useState } from "react";

import { ChatSupport } from "@/components/ChatSupport";
import { FeedbackScreen } from "@/components/FeedbackScreen";
import {
  MascotAssistant,
  type MascotMood
} from "@/components/MascotAssistant";
import { QuizLoadingSkeleton } from "@/components/QuizLoadingSkeleton";
import { QuizScreen } from "@/components/QuizScreen";
import { QuizSetup } from "@/components/QuizSetup";
import { SummaryScreen } from "@/components/SummaryScreen";
import { gradeAnswer } from "@/lib/grading";
import { postJsonWithRateLimitRetry } from "@/lib/http";
import type {
  Quiz,
  QuizAnswerResult,
  QuizGenerationRequest,
} from "@/types/quiz";

type ViewState = "setup" | "quiz" | "feedback" | "summary";

const initialRequest: QuizGenerationRequest = {
  level: "beginner",
  subtopic: "grammar",
  type: "multiple_choice",
  count: 10,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
}

function getMascotMood(
  view: ViewState,
  isGenerating: boolean,
  latestResult: QuizAnswerResult | null,
): MascotMood {
  if (isGenerating) {
    return "loading";
  }

  if (view === "quiz") {
    return "quiz";
  }

  if (view === "feedback") {
    return latestResult?.isCorrect ? "correct" : "wrong";
  }

  if (view === "summary") {
    return "summary";
  }

  return "idle";
}

function getMascotMessage(mood: MascotMood): string {
  switch (mood) {
    case "loading":
      return "Aku lagi nyusun soal yang pas. Tunggu sebentar, ya.";
    case "quiz":
      return "Kalau mentok, minta clue dulu. Aku bantu kasih arah tanpa membocorkan jawaban.";
    case "correct":
      return "Benar. Simpan pola jawabannya, biasanya muncul lagi di bentuk soal lain.";
    case "wrong":
      return "Belum pas. Coba cek kata kunci dan bandingkan dengan jawaban yang benar.";
    case "summary":
      return "Selesai. Cek bagian yang sering meleset, itu bahan latihan berikutnya.";
    case "idle":
    default:
      return "Pilih level, topik, dan jumlah soal. Nanti aku temani dari awal sampai selesai.";
  }
}

export function EnglishQuizApp() {
  const [requestConfig, setRequestConfig] =
    useState<QuizGenerationRequest>(initialRequest);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [view, setView] = useState<ViewState>("setup");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [results, setResults] = useState<QuizAnswerResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [quickChatPrompt, setQuickChatPrompt] = useState("");

  async function startQuiz(config: QuizGenerationRequest) {
    setIsGenerating(true);
    setError("");
    setRequestConfig(config);

    try {
      const generatedQuiz = await postJsonWithRateLimitRetry<Quiz>(
        "/api/generate-quiz",
        config,
      );

      if (generatedQuiz.questions.length === 0) {
        throw new Error("Soal belum tersedia. Silakan coba lagi.");
      }

      setQuiz(generatedQuiz);
      setCurrentIndex(0);
      setCurrentAnswer("");
      setResults([]);
      setView("quiz");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsGenerating(false);
    }
  }

  function submitAnswer() {
    if (!quiz) return;

    const question = quiz.questions[currentIndex];
    const isCorrect = gradeAnswer(question, currentAnswer);

    setResults((previousResults) => [
      ...previousResults,
      {
        question,
        userAnswer: currentAnswer,
        isCorrect,
      },
    ]);
    setView("feedback");
  }

  function replaceCurrentQuestion() {
    setQuiz((currentQuiz) => {
      if (
        !currentQuiz ||
        currentQuiz.questions.length <= 1 ||
        currentIndex >= currentQuiz.questions.length - 1
      ) {
        return currentQuiz;
      }

      const beforeCurrent = currentQuiz.questions.slice(0, currentIndex);
      const currentQuestionToMove = currentQuiz.questions[currentIndex];
      const afterCurrent = currentQuiz.questions.slice(currentIndex + 1);

      return {
        ...currentQuiz,
        questions: [...beforeCurrent, ...afterCurrent, currentQuestionToMove],
      };
    });
    setCurrentAnswer("");
  }

  function goToNextQuestion() {
    if (!quiz) return;

    if (currentIndex >= quiz.questions.length - 1) {
      setView("summary");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setCurrentAnswer("");
    setView("quiz");
  }

  function retrySameQuiz() {
    setCurrentIndex(0);
    setCurrentAnswer("");
    setResults([]);
    setView("quiz");
  }

  function newQuiz() {
    setQuiz(null);
    setCurrentIndex(0);
    setCurrentAnswer("");
    setResults([]);
    setError("");
    setView("setup");
  }

  function askForClue() {
    setQuickChatPrompt(
      "Bantu kasih clue untuk soal ini, tapi jangan kasih jawaban langsung.",
    );
  }

  const currentQuestion = quiz?.questions[currentIndex] ?? null;
  const latestResult = results[results.length - 1] ?? null;
  const mascotMood = getMascotMood(view, isGenerating, latestResult);

  return (
    <main className="min-h-screen px-4 pb-44 pt-6 sm:px-6 lg:px-8 lg:pb-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end">
          <div>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              English Quiz Chatbot
            </h1>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="h-fit self-start rounded-lg border border-slate-200 bg-white p-4 shadow-panel sm:p-6">
            {view === "setup" && isGenerating && <QuizLoadingSkeleton />}

            {view === "setup" && !isGenerating && (
              <QuizSetup
                config={requestConfig}
                error={error}
                isLoading={isGenerating}
                onChange={setRequestConfig}
                onStart={startQuiz}
              />
            )}

            {view === "quiz" && currentQuestion && quiz && (
              <QuizScreen
                answer={currentAnswer}
                onAnswerChange={setCurrentAnswer}
                onReplaceQuestion={replaceCurrentQuestion}
                onSubmit={submitAnswer}
                question={currentQuestion}
                questionIndex={currentIndex}
                totalQuestions={quiz.questions.length}
              />
            )}

            {view === "feedback" && latestResult && (
              <FeedbackScreen
                isLastQuestion={
                  quiz ? currentIndex === quiz.questions.length - 1 : false
                }
                result={latestResult}
                onNext={goToNextQuestion}
              />
            )}

            {view === "summary" && quiz && (
              <SummaryScreen
                quiz={quiz}
                results={results}
                onNewQuiz={newQuiz}
                onRetry={retrySameQuiz}
              />
            )}
          </section>

          <ChatSupport
            question={currentQuestion}
            quickPrompt={quickChatPrompt}
            onQuickPromptConsumed={() => setQuickChatPrompt("")}
          />
        </div>
      </div>

      <MascotAssistant
        canAskClue={view === "quiz" && Boolean(currentQuestion)}
        message={getMascotMessage(mascotMood)}
        mood={mascotMood}
        onAskClue={askForClue}
      />
    </main>
  );
}
