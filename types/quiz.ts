export const SUBTOPICS = [
  "grammar",
  "vocabulary",
  "translation",
  "conversation"
] as const;

export type Subtopic = (typeof SUBTOPICS)[number];

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type Level = (typeof LEVELS)[number];

export const QUESTION_TYPES = ["multiple_choice", "fill_in_blank"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUIZ_REQUEST_TYPES = [
  "multiple_choice",
  "fill_in_blank",
  "mixed"
] as const;

export type QuizRequestType = (typeof QUIZ_REQUEST_TYPES)[number];

export interface Question {
  id: string;
  type: QuestionType;
  subtopic: Subtopic;
  level: Level;
  question: string;
  options: string[];
  correct_answer: string;
  acceptable_answers: string[];
  explanation: string;
  skill_tag: string;
  material_recommendation: string;
}

export interface Quiz {
  level: Level;
  subtopic: Subtopic;
  questions: Question[];
}

export interface QuizGenerationRequest {
  level: Level;
  subtopic: Subtopic;
  type: QuizRequestType;
  count: number;
}

export interface QuizAnswerResult {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
}

export interface ChatQuizContext {
  question: string;
  type: QuestionType;
  options: string[];
  level: Level;
  subtopic: Subtopic;
  skill_tag: string;
}
