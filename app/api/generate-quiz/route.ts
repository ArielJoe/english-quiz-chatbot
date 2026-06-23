import { NextResponse } from "next/server";

import { generateQuiz } from "@/lib/gemini";
import { isInvalidApiKeyError, isRateLimitError } from "@/lib/retry";
import { parseQuizRequest } from "@/lib/validation";

export const runtime = "nodejs";

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

    if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "Konfigurasi layanan kuis belum tersedia di server." },
        { status: 502 }
      );
    }

    if (isInvalidApiKeyError(error)) {
      return NextResponse.json(
        {
          error:
            "API key Gemini tidak valid. Periksa nilai GEMINI_API_KEY di file environment server, lalu restart dev server."
        },
        { status: 502 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("jumlah soal valid")
    ) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Gagal membuat soal. Silakan coba lagi." },
      { status: 502 }
    );
  }
}
