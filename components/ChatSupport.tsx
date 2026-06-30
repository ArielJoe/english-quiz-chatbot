"use client";

import { FormEvent, type ReactNode, useEffect, useRef, useState } from "react";

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

// Render inline **tebal** dan `kode` agar respons Lingo lebih rapi.
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] font-medium text-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
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
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        const bulletMatch = line.match(/^[-*]\s+(.+)/);
        const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/);

        if (bulletMatch) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{renderInline(bulletMatch[1])}</span>
            </div>
          );
        }

        if (numberedMatch) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="shrink-0 font-bold text-brand-600">
                {numberedMatch[1]}.
              </span>
              <span>{renderInline(numberedMatch[2])}</span>
            </div>
          );
        }

        return <p key={`${line}-${index}`}>{renderInline(line)}</p>;
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
      text: "Halo, saya Lingo. Silakan tanyakan pola kalimat, arti kata, atau minta petunjuk soal. Jawaban akhirnya tetap Anda yang menentukan."
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
    <aside className="flex flex-col rounded-2xl border-2 border-slate-200 bg-white shadow-panel lg:h-full lg:min-h-0 lg:min-w-0">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-sm font-black text-white shadow-[0_3px_0_#387f06]">
          L
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Lingo</h2>
          <p className="text-sm text-slate-600">
            Tanya materi, arti kata, atau minta clue soal.
          </p>
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto px-4 py-4 lg:max-h-none lg:min-h-0 lg:flex-1">
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-md px-3 py-2 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-8 bg-brand-500 text-white"
                  : "mr-8 bg-slate-100 text-slate-800"
              }`}
            >
              <ChatMessageContent message={message} />
            </div>
          ))}
          {isSending && (
            <div className="mr-8 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Sebentar, Lingo sedang menyiapkan jawaban...
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
            className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            maxLength={500}
            placeholder="Tulis pertanyaan Anda"
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
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#387f06] transition hover:bg-brand-600 active:translate-y-[2px] active:shadow-[0_1px_0_#387f06] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:active:translate-y-0"
            disabled={inputValue.trim().length < 2 || isSending}
          >
            Kirim
          </button>
        </div>
      </form>
    </aside>
  );
}
