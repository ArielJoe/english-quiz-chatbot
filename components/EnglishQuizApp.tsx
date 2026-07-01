"use client";

import { useEffect, useRef, useState } from "react";

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
import { findTypoSuggestion } from "@/lib/typo";
import type {
  ChatQuizContext,
  Question,
  Quiz,
  QuizAnswerResult,
  QuizGenerationRequest,
} from "@/types/quiz";

type ViewState = "setup" | "quiz" | "feedback" | "summary";

interface MascotSpeech {
  mood: MascotMood;
  source: "clue" | "typo";
  text: string;
}

const initialRequest: QuizGenerationRequest = {
  level: "beginner",
  subtopic: "grammar",
  type: "multiple_choice",
  count: 5,
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
      return "Mohon tunggu sebentar, saya sedang menyiapkan soal untuk Anda.";
    case "quiz":
      return "Jika menemui kesulitan, silakan minta clue. Saya akan memberi arah tanpa membocorkan jawaban.";
    case "correct":
      return "Bagus, jawaban Anda tepat. Mari lanjutkan ke soal berikutnya.";
    case "wrong":
      return "Belum tepat, tidak apa-apa. Cermati kembali kata kuncinya pada soal berikutnya.";
    case "summary":
      return "Latihan selesai. Mari tinjau bagian yang masih bisa ditingkatkan.";
    case "idle":
    default:
      return "Halo, saya Lingo. Silakan pilih level, topik, dan jumlah soal, lalu kita mulai latihannya.";
  }
}

function toClueContext(question: Question): ChatQuizContext {
  return {
    question: question.question,
    type: question.type,
    options: question.options,
    level: question.level,
    subtopic: question.subtopic,
    skill_tag: question.skill_tag,
  };
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
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState("");
  const [mascotSpeech, setMascotSpeech] = useState<MascotSpeech | null>(null);
  const clueTokenRef = useRef(0);

  function clearMascotSpeech() {
    clueTokenRef.current += 1;
    setMascotSpeech(null);
  }

  async function startQuiz(config: QuizGenerationRequest) {
    setIsGenerating(true);
    setError("");
    setRequestConfig(config);
    clearMascotSpeech();

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

  async function submitAnswer() {
    if (!quiz) return;

    const question = quiz.questions[currentIndex];
    let isCorrect = gradeAnswer(question, currentAnswer);

    if (!isCorrect && question.type === "fill_in_blank") {
      setIsGrading(true);
      try {
        const response = await postJsonWithRateLimitRetry<{ isCorrect: boolean }>(
          "/api/grade-fill-in-blank",
          {
            questionText: question.question,
            acceptableAnswers: question.acceptable_answers,
            userAnswer: currentAnswer,
          },
        );
        isCorrect = response.isCorrect;
      } catch (e) {
        console.error("Gagal melakukan grading semantis:", e);
      } finally {
        setIsGrading(false);
      }
    }

    setResults((previousResults) => [
      ...previousResults,
      {
        question,
        userAnswer: currentAnswer,
        isCorrect,
      },
    ]);
    clearMascotSpeech();
    setView("feedback");
  }

  function goToNextQuestion() {
    if (!quiz) return;

    clearMascotSpeech();

    if (currentIndex >= quiz.questions.length - 1) {
      setView("summary");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setCurrentAnswer("");
    setView("quiz");
  }

  function retrySameQuiz() {
    clearMascotSpeech();
    setCurrentIndex(0);
    setCurrentAnswer("");
    setResults([]);
    setView("quiz");
  }

  function newQuiz() {
    clearMascotSpeech();
    setQuiz(null);
    setCurrentIndex(0);
    setCurrentAnswer("");
    setResults([]);
    setError("");
    setView("setup");
  }

  async function askForClue() {
    if (!currentQuestion) return;

    const token = clueTokenRef.current + 1;
    clueTokenRef.current = token;
    setMascotSpeech({
      mood: "quiz",
      source: "clue",
      text: "Sebentar, Lingo siapkan petunjuknya...",
    });

    try {
      const response = await postJsonWithRateLimitRetry<{ message: string }>(
        "/api/chat-support",
        {
          message:
            "Tolong beri satu petunjuk singkat untuk membantu saya menjawab soal ini, tanpa menyebutkan jawabannya secara langsung.",
          quizContext: toClueContext(currentQuestion),
        },
      );

      if (clueTokenRef.current === token) {
        setMascotSpeech({ mood: "quiz", source: "clue", text: response.message });
      }
    } catch {
      if (clueTokenRef.current === token) {
        setMascotSpeech({
          mood: "quiz",
          source: "clue",
          text: "Maaf, Lingo belum bisa memberi petunjuk sekarang. Silakan coba lagi sebentar lagi.",
        });
      }
    }
  }

  const currentQuestion = quiz?.questions[currentIndex] ?? null;
  const latestResult = results[results.length - 1] ?? null;
  const baseMood = getMascotMood(view, isGenerating, latestResult);
  const mascotMood = mascotSpeech?.mood ?? baseMood;
  const mascotMessage = mascotSpeech?.text ?? getMascotMessage(baseMood);

  // Saat mengisi fill-in-blank, Lingo otomatis menyarankan koreksi bila
  // jawaban yang diketik tampak seperti salah ketik dari kata yang benar.
  useEffect(() => {
    if (
      view !== "quiz" ||
      !currentQuestion ||
      currentQuestion.type !== "fill_in_blank"
    ) {
      return;
    }

    const candidates = [
      currentQuestion.correct_answer,
      ...currentQuestion.acceptable_answers,
    ];

    const handle = window.setTimeout(() => {
      const suggestion = findTypoSuggestion(currentAnswer, candidates);

      if (suggestion) {
        setMascotSpeech({
          mood: "quiz",
          source: "typo",
          text: `Sepertinya ada salah ketik. Mungkin maksud Anda "${suggestion}"?`,
        });
      } else {
        setMascotSpeech((previous) =>
          previous?.source === "typo" ? null : previous,
        );
      }
    }, 600);

    return () => window.clearTimeout(handle);
  }, [currentAnswer, currentQuestion, view]);

  return (
    <main className="flex min-h-screen flex-col px-4 pt-4 sm:px-6 lg:h-screen lg:overflow-hidden lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 pb-4 lg:min-h-0">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 pb-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-xl font-black text-white shadow-[0_4px_0_#387f06]">
            L
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Lingo<span className="text-brand-500">fy</span>
            </h1>
            <p className="text-sm font-semibold text-slate-500">
              Kuis Bahasa Inggris bareng Lingo
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-rows-1 lg:grid-cols-[7fr_3fr]">
          <section className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-panel sm:p-6 lg:min-h-0 lg:min-w-0 lg:overflow-y-auto">
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
                onAskClue={askForClue}
                onSubmit={submitAnswer}
                question={currentQuestion}
                questionIndex={currentIndex}
                totalQuestions={quiz.questions.length}
                isSubmitting={isGrading}
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

          <ChatSupport question={currentQuestion} />
        </div>
      </div>

      <MascotAssistant message={mascotMessage} mood={mascotMood} />
    </main>
  );
}
