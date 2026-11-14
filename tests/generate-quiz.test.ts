import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";

import { POST } from "@/app/api/generate-quiz/route";
import { POST as chatPOST } from "@/app/api/chat-support/route";
import { chatSupport, generateQuiz, gradeFillInBlankWithLlm, QuizGenerationError } from "@/lib/groq";
import { gradeAnswer } from "@/lib/grading";
import { ApiClientError, postJson } from "@/lib/http";
import type { Question, QuizGenerationRequest } from "@/types/quiz";

const config: QuizGenerationRequest = {
  level: "beginner", subtopic: "grammar", type: "multiple_choice", count: 1
};
const question: Question = {
  id: "q1", type: "multiple_choice", level: "beginner", subtopic: "grammar",
  question: "She ___ tea every day.", options: ["drinks", "drink", "drinking", "drunk"],
  correct_answer: "drinks", acceptable_answers: [], explanation: "Subjek she menggunakan kata kerja drinks.",
  skill_tag: "simple_present", material_recommendation: "Pelajari simple present dan kesesuaian subjek."
};

const originalKey = process.env.GROQ_API_KEY;
const originalModel = process.env.GROQ_MODEL;
const originalVercelEnv = process.env.VERCEL_ENV;

beforeEach(() => {
  process.env.GROQ_API_KEY = "test-key";
  delete process.env.GROQ_MODEL;
  delete process.env.VERCEL_ENV;
});

afterEach(() => {
  mock.restoreAll();
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.GROQ_MODEL;
  else process.env.GROQ_MODEL = originalModel;
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
});

function completion(content = JSON.stringify({ questions: [question] }), finishReason = "stop") {
  return Response.json({ choices: [{ message: { content }, finish_reason: finishReason }] });
}

function request(body: unknown = config) {
  return new Request("http://localhost/api/generate-quiz", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
}

test("uses an available default model and allows a server environment override", async () => {
  const models: string[] = [];
  mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as {
      model: string; reasoning_effort?: string; include_reasoning?: boolean;
      max_completion_tokens?: number;
    };
    models.push(body.model);
    if (body.model === "openai/gpt-oss-20b") {
      assert.equal(body.reasoning_effort, "low");
      assert.equal(body.include_reasoning, false);
      assert.equal(body.max_completion_tokens, 1524);
    } else {
      assert.equal(body.reasoning_effort, undefined);
      assert.equal(body.include_reasoning, undefined);
    }
    return completion();
  });
  await generateQuiz(config);
  process.env.GROQ_MODEL = " custom-model ";
  await generateQuiz(config);
  assert.deepEqual(models, ["openai/gpt-oss-20b", "custom-model"]);
});

test("retries malformed JSON instead of immediately failing the quiz", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async () => ++calls === 1 ? completion('{"questions":[') : completion());
  const quiz = await generateQuiz(config);
  assert.equal(calls, 2);
  assert.equal(quiz.questions.length, 1);
});

test("retries a Groq JSON validation error", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async () => ++calls === 1
    ? Response.json({ error: { code: "json_validate_failed", message: "Invalid JSON" } }, { status: 400 })
    : completion());
  assert.equal((await generateQuiz(config)).questions.length, 1);
  assert.equal(calls, 2);
});

test("retains validated questions while requesting only missing questions", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    calls++;
    if (calls === 1) return completion();
    assert.match(String(init.body), /Hasilkan 1 soal/);
    return completion(JSON.stringify({ questions: [{ ...question, id: "q2", question: "He ___ tea every day." }] }));
  });
  const quiz = await generateQuiz({ ...config, count: 2 });
  assert.equal(quiz.questions.length, 2);
  assert.equal(calls, 2);
});

test("rejects incomplete quizzes and stops after three attempts", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async () => { calls++; return completion(); });
  await assert.rejects(generateQuiz({ ...config, count: 2 }), QuizGenerationError);
  assert.equal(calls, 3);
});

test("retries truncated output even when it contains parseable JSON", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async () => ++calls === 1 ? completion(undefined, "length") : completion());
  assert.equal((await generateQuiz(config)).questions.length, 1);
  assert.equal(calls, 2);
});

test("unavailable models return an actionable error without retries or provider output", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ error: { code: "model_not_found", message: "private provider details" } }, { status: 404 });
  });
  const response = await POST(request());
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.match(body, /GROQ_MODEL/);
  assert.doesNotMatch(body, /private provider details|test-key/);
  assert.equal(calls, 1);
});

test("temporary service errors are retried within a single generation request", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async () => ++calls === 1
    ? Response.json({ error: { message: "Unavailable" } }, { status: 503 })
    : completion());
  assert.equal((await generateQuiz(config)).questions.length, 1);
  assert.equal(calls, 2);
});

test("persistent rate limits stop after three provider calls", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ error: { message: "Rate limit" } }, { status: 429 });
  });
  assert.equal((await POST(request())).status, 429);
  assert.equal(calls, 3);
});

test("rejects invalid input and malformed request JSON before contacting Groq", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => { throw new Error("Must not call Groq"); });
  for (const body of [{ ...config, count: 11 }, { ...config, level: "invalid" }, null]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  const malformed = new Request("http://localhost/api/generate-quiz", { method: "POST", body: "{" });
  assert.equal((await POST(malformed)).status, 400);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("browser generation transport does not repeat a rate-limited request", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ error: "Layanan sedang ramai" }, { status: 429 }));
  await assert.rejects(postJson("/api/generate-quiz", config), ApiClientError);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("multiple-choice grading stays deterministic and does not contact Groq", () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => { throw new Error("Must not call Groq"); });
  assert.equal(gradeAnswer(question, "drinks"), true);
  assert.equal(gradeAnswer(question, "drink"), false);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("missing API configuration fails without contacting Groq or exposing secrets", async () => {
  delete process.env.GROQ_API_KEY;
  const fetchMock = mock.method(globalThis, "fetch", async () => { throw new Error("Must not call Groq"); });
  const response = await POST(request());
  assert.equal(response.status, 502);
  assert.match(await response.text(), /Konfigurasi layanan kuis/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("invalid API keys are not retried and provider details remain private", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({
    error: { code: "invalid_api_key", message: "Invalid API key: test-key" }
  }, { status: 401 }));
  const response = await POST(request());
  assert.equal(response.status, 502);
  const body = await response.text();
  assert.match(body, /API key Groq tidak valid/);
  assert.doesNotMatch(body, /test-key/);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("production authentication errors direct quiz and chat users to redeploy", async () => {
  process.env.VERCEL_ENV = "production";
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({
    error: { code: "invalid_api_key", message: "Invalid API key: test-key" }
  }, { status: 401 }));

  for (const response of [await POST(request()), await chatPOST(request({ message: "Apa itu grammar?" }))]) {
    assert.equal(response.status, 502);
    const body = await response.text();
    assert.match(body, /Production di Vercel/);
    assert.match(body, /redeploy/);
    assert.doesNotMatch(body, /restart dev server|test-key/);
  }
  assert.equal(fetchMock.mock.callCount(), 2);
});

test("semantic grading allows reasoning tokens before the final boolean answer", async () => {
  mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { max_completion_tokens?: number };
    assert.ok(body.max_completion_tokens && body.max_completion_tokens >= 1024);
    return completion("true");
  });
  assert.equal(await gradeFillInBlankWithLlm(question.question, ["drinks"], "drinks"), true);
});

test("chat uses the budget model with low reasoning and a bounded response", async () => {
  mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as {
      model: string; reasoning_effort?: string; max_completion_tokens?: number;
    };
    assert.equal(body.model, "openai/gpt-oss-20b");
    assert.equal(body.reasoning_effort, "low");
    assert.equal(body.max_completion_tokens, 1024);
    return completion("Simple present digunakan untuk kebiasaan.");
  });
  assert.match(await chatSupport("Apa itu simple present tense?"), /kebiasaan/);
});
