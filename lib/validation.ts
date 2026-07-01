import {
  LEVELS,
  QUESTION_TYPES,
  QUIZ_REQUEST_TYPES,
  SUBTOPICS,
  type ChatQuizContext,
  type Level,
  type Question,
  type QuestionType,
  type QuizGenerationRequest,
  type QuizRequestType,
  type Subtopic
} from "@/types/quiz";

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isLevel(value: unknown): value is Level {
  return typeof value === "string" && LEVELS.includes(value as Level);
}

export function isSubtopic(value: unknown): value is Subtopic {
  return typeof value === "string" && SUBTOPICS.includes(value as Subtopic);
}

export function isQuestionType(value: unknown): value is QuestionType {
  return (
    typeof value === "string" && QUESTION_TYPES.includes(value as QuestionType)
  );
}

export function isQuizRequestType(value: unknown): value is QuizRequestType {
  return (
    typeof value === "string" &&
    QUIZ_REQUEST_TYPES.includes(value as QuizRequestType)
  );
}

export function parseQuizRequest(
  body: unknown
): ValidationResult<QuizGenerationRequest> {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body harus berupa JSON object." };
  }

  if (!isLevel(body.level)) {
    return { ok: false, error: "Level tidak valid." };
  }

  if (!isSubtopic(body.subtopic)) {
    return { ok: false, error: "Subtopik tidak valid." };
  }

  if (!isQuizRequestType(body.type)) {
    return { ok: false, error: "Tipe soal tidak valid." };
  }

  if (
    typeof body.count !== "number" ||
    !Number.isInteger(body.count) ||
    body.count < 1 ||
    body.count > 10
  ) {
    return { ok: false, error: "Jumlah soal harus berupa angka 1 sampai 10." };
  }

  return {
    ok: true,
    data: {
      level: body.level,
      subtopic: body.subtopic,
      type: body.type,
      count: body.count
    }
  };
}

export function parseChatRequest(
  body: unknown
): ValidationResult<{ message: string; quizContext?: ChatQuizContext }> {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body harus berupa JSON object." };
  }

  if (typeof body.message !== "string") {
    return { ok: false, error: "Pesan harus berupa teks." };
  }

  const message = body.message.trim();

  if (message.length < 2) {
    return { ok: false, error: "Pesan terlalu pendek." };
  }

  if (message.length > 500) {
    return { ok: false, error: "Pesan maksimal 500 karakter." };
  }

  if (body.quizContext === undefined) {
    return { ok: true, data: { message } };
  }

  if (!isRecord(body.quizContext)) {
    return { ok: false, error: "Konteks kuis tidak valid." };
  }

  const context = body.quizContext;

  if (
    typeof context.question !== "string" ||
    !context.question.trim() ||
    context.question.length > 500 ||
    !isQuestionType(context.type) ||
    !isLevel(context.level) ||
    !isSubtopic(context.subtopic) ||
    !isStringArray(context.options) ||
    context.options.length > 4 ||
    typeof context.skill_tag !== "string" ||
    context.skill_tag.length > 100
  ) {
    return { ok: false, error: "Konteks kuis tidak valid." };
  }

  return {
    ok: true,
    data: {
      message,
      quizContext: {
        question: context.question.trim(),
        type: context.type,
        options: context.options
          .map((option) => option.trim())
          .filter(Boolean)
          .slice(0, 4),
        level: context.level,
        subtopic: context.subtopic,
        skill_tag: context.skill_tag.trim()
      }
    }
  };
}

function normalizeEnumValue(value: unknown): unknown {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

function normalizeQuestionType(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (["multiple_choice", "multiplechoice", "mcq", "pilihan_ganda"].includes(normalized)) {
    return "multiple_choice";
  }

  if (
    ["fill_in_blank", "fill_in_the_blank", "fillintheblank", "isian"].includes(
      normalized
    )
  ) {
    return "fill_in_blank";
  }

  return normalized;
}

export function coerceQuestion(value: unknown): Question | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = normalizeQuestionType(value.type);
  const subtopic = normalizeEnumValue(value.subtopic);
  const level = normalizeEnumValue(value.level);

  if (!isQuestionType(type) || !isSubtopic(subtopic) || !isLevel(level)) {
    return null;
  }

  const question: Question = {
    id: typeof value.id === "string" ? value.id.trim() : "",
    type,
    subtopic,
    level,
    question:
      typeof value.question === "string" ? value.question.trim() : "",
    options: isStringArray(value.options)
      ? value.options.map((option) => option.trim()).filter(Boolean)
      : [],
    correct_answer:
      typeof value.correct_answer === "string"
        ? value.correct_answer.trim()
        : "",
    acceptable_answers: isStringArray(value.acceptable_answers)
      ? value.acceptable_answers
          .map((answer) => answer.trim().toLowerCase())
          .filter(Boolean)
      : [],
    explanation:
      typeof value.explanation === "string" ? value.explanation.trim() : "",
    skill_tag:
      typeof value.skill_tag === "string" ? value.skill_tag.trim() : "",
    material_recommendation:
      typeof value.material_recommendation === "string"
        ? value.material_recommendation.trim()
        : ""
  };

  // Samakan correct_answer ke opsi yang cocok meski beda kapitalisasi/spasi.
  if (
    question.type === "multiple_choice" &&
    !question.options.includes(question.correct_answer)
  ) {
    const match = question.options.find(
      (option) =>
        option.toLowerCase() === question.correct_answer.toLowerCase()
    );

    if (match) {
      question.correct_answer = match;
    }
  }

  return question;
}

export function isValidQuestion(q: Question): boolean {
  if (!q.id || !q.type || !q.subtopic || !q.level) return false;
  if (!q.question.trim()) return false;
  if (!q.correct_answer.trim()) return false;
  if (!q.explanation.trim()) return false;
  if (!q.skill_tag.trim()) return false;
  if (!q.material_recommendation.trim()) return false;

  if (q.type === "multiple_choice") {
    if (q.options.length !== 4) return false;
    if (!q.options.includes(q.correct_answer)) return false;

    const uniqueOptions = new Set(
      q.options.map((option) => option.toLowerCase())
    );
    if (uniqueOptions.size !== q.options.length) return false;
  }

  if (q.type === "fill_in_blank") {
    if (q.options.length !== 0) return false;
    if (q.acceptable_answers.length === 0) return false;
  }

  return true;
}

export function questionMatchesRequest(
  question: Question,
  request: QuizGenerationRequest
): boolean {
  if (question.level !== request.level) return false;
  if (question.subtopic !== request.subtopic) return false;
  if (request.type !== "mixed" && question.type !== request.type) return false;

  return true;
}
