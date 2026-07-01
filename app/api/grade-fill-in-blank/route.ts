import { NextResponse } from "next/server";

import { gradeFillInBlankWithLlm } from "@/lib/groq";
import { isInvalidApiKeyError, isRateLimitError } from "@/lib/retry";
import { parseFillInBlankGradeRequest } from "@/lib/validation";

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

  const parsed = parseFillInBlankGradeRequest(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const { questionText, acceptableAnswers, userAnswer } = parsed.data;
    const isCorrect = await gradeFillInBlankWithLlm(
      questionText,
      acceptableAnswers,
      userAnswer
    );

    return NextResponse.json({ isCorrect });
  } catch (error) {
    if (isRateLimitError(error)) {
      // Jika rate limit, anggap salah agar tidak menggantung UI.
      return NextResponse.json({ isCorrect: false }, { status: 200 });
    }

    if (isInvalidApiKeyError(error)) {
      return NextResponse.json({ isCorrect: false }, { status: 200 });
    }

    // Fallback aman: anggap salah daripada crash.
    return NextResponse.json({ isCorrect: false }, { status: 200 });
  }
}
