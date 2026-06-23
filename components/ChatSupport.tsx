"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { postJsonWithRateLimitRetry } from "@/lib/http";
import type { ChatQuizContext, Question } from "@/types/quiz";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface ChatResponse {
  message: string;
}

interface ChatSupportProps {
  onQuickPromptConsumed?: () => void;
  question: Question | null;
  quickPrompt?: string;
}

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Chat gagal merespons. Silakan coba lagi.";
}

function ChatMessageContent({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return <span className="whitespace-pre-wrap">{message.text}</span>;
  }

  const lines = message.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const bulletMatch = line.match(/^[-*]\s+(.+)/);
        const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/);

        if (bulletMatch) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
              <span>{bulletMatch[1]}</span>
            </div>
          );
        }

        if (numberedMatch) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="shrink-0 font-semibold text-slate-600">
                {numberedMatch[1]}.
              </span>
              <span>{numberedMatch[2]}</span>
            </div>
          );
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}

function toChatQuizContext(question: Question | null): ChatQuizContext | null {
  if (!question) {
    return null;
  }

  return {
    question: question.question,
    type: question.type,
    options: question.options,
    level: question.level,
    subtopic: question.subtopic,
    skill_tag: question.skill_tag
  };
}

export function ChatSupport({
  onQuickPromptConsumed,
  question,
  quickPrompt
}: ChatSupportProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-assistant-message",
      role: "assistant",
      text: "Lagi bingung di soal? Tulis aja. Aku bisa bantu jelasin pola kalimat, arti kata, atau kasih clue pelan-pelan. Jawaban finalnya tetap kamu yang pilih :)"
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputValue = quickPrompt && quickPrompt.length > 0 ? quickPrompt : input;

  useEffect(() => {
    if (!quickPrompt) {
      return;
    }

    inputRef.current?.focus();
  }, [quickPrompt]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = inputValue.trim();

    if (!trimmedInput || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      text: trimmedInput
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    if (quickPrompt) {
      onQuickPromptConsumed?.();
    }
    setError("");
    setIsSending(true);

    try {
      const response = await postJsonWithRateLimitRetry<ChatResponse>(
        "/api/chat-support",
        {
          message: trimmedInput,
          quizContext: toChatQuizContext(question) ?? undefined
        }
      );

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: "assistant",
          text: response.message
        }
      ]);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <aside className="flex h-fit self-start flex-col rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-lg font-bold text-slate-950">Chatbot</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tanya materi, arti kata, atau minta clue soal.
        </p>
      </div>

      <div className="max-h-[420px] overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-md px-3 py-2 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-8 bg-slate-950 text-white"
                  : "mr-8 bg-slate-100 text-slate-800"
              }`}
            >
              <ChatMessageContent message={message} />
            </div>
          ))}
          {isSending && (
            <div className="mr-8 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Bentar, aku cek dulu...
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <form className="border-t border-slate-200 p-4" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            maxLength={500}
            placeholder="Tulis pertanyaanmu"
            value={inputValue}
            onChange={(event) => {
              setInput(event.target.value);
              if (quickPrompt) {
                onQuickPromptConsumed?.();
              }
            }}
          />
          <button
            type="submit"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={inputValue.trim().length < 2 || isSending}
          >
            Kirim
          </button>
        </div>
      </form>
    </aside>
  );
}
