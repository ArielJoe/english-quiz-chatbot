import { NextResponse } from "next/server";
import Groq from "groq-sdk";

import { generateQuiz, getGroqErrorCode, QuizGenerationError } from "@/lib/groq";
import { isInvalidApiKeyError, isRateLimitError } from "@/lib/retry";
import { parseQuizRequest } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body harus berupa JSON valid." },
      { status: 400 }
    );
  }

  const parsed = parseQuizRequest(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const quiz = await generateQuiz(parsed.data);

    return NextResponse.json(quiz);
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: "Layanan sedang ramai. Silakan coba lagi sebentar lagi." },
        { status: 429 }
      );
    }

    if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
      return NextResponse.json(
        { error: "Konfigurasi layanan kuis belum tersedia di server." },
        { status: 502 }
      );
    }

    if (isInvalidApiKeyError(error)) {
      return NextResponse.json(
        {
          error:
            "API key Groq tidak valid. Periksa nilai GROQ_API_KEY di file environment server, lalu restart dev server."
        },
        { status: 502 }
      );
    }

    if (error instanceof QuizGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    if (error instanceof Groq.APIError && (error.status === 404 || getGroqErrorCode(error) === "model_decommissioned")) {
      return NextResponse.json(
        { error: "Model Groq tidak tersedia. Periksa GROQ_MODEL di konfigurasi server dan gunakan model yang masih aktif." },
        { status: 503 }
      );
    }

    if (error instanceof Groq.APIConnectionTimeoutError) {
      return NextResponse.json(
        { error: "Pembuatan soal terlalu lama. Silakan coba lagi sebentar lagi." },
        { status: 504 }
      );
    }

    if (error instanceof Groq.APIConnectionError) {
      return NextResponse.json(
        { error: "Server belum dapat terhubung ke Groq. Periksa koneksi server, lalu coba lagi." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Gagal membuat soal. Silakan coba lagi." },
      { status: 502 }
    );
  }
}
