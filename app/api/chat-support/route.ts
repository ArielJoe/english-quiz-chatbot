import { NextResponse } from "next/server";

import { chatSupport } from "@/lib/gemini";
import { isInvalidApiKeyError, isRateLimitError } from "@/lib/retry";
import { parseChatRequest } from "@/lib/validation";

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

  const parsed = parseChatRequest(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const message = await chatSupport(
      parsed.data.message,
      parsed.data.quizContext
    );

    return NextResponse.json({ message });
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: "Layanan sedang ramai. Silakan coba lagi sebentar lagi." },
        { status: 429 }
      );
    }

    if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
      return NextResponse.json(
        { error: "Konfigurasi layanan chat belum tersedia di server." },
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

    return NextResponse.json(
      { error: "Gagal menjawab pesan. Silakan coba lagi." },
      { status: 502 }
    );
  }
}
