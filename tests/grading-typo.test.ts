import assert from "node:assert/strict";
import { test } from "node:test";

import { formatSkillTag } from "@/lib/format";
import { gradeAnswerDetailed, isMinorTypo } from "@/lib/grading";
import type { Question } from "@/types/quiz";

const fill = (correct: string, acceptable: string[] = [correct]): Question => ({
  id: "q", type: "fill_in_blank", subtopic: "vocabulary", level: "beginner",
  question: "___", options: [], correct_answer: correct, acceptable_answers: acceptable,
  explanation: "", skill_tag: "x", material_recommendation: ""
});

test("minor typos are accepted and report the intended spelling", () => {
  assert.deepEqual(gradeAnswerDetailed(fill("beautiful"), "beautifull"), { isCorrect: true, typoOf: "beautiful" });
  assert.deepEqual(gradeAnswerDetailed(fill("restaurant"), "restaruant"), { isCorrect: true, typoOf: "restaurant" });
  assert.equal(gradeAnswerDetailed(fill("the"), "teh").isCorrect, true);
  assert.equal(gradeAnswerDetailed(fill("library", []), "libary").isCorrect, true);
});

test("grammar mistakes and different short words are not treated as typos", () => {
  assert.equal(isMinorTypo("drink", "drinks"), false);
  assert.equal(isMinorTypo("walk", "walked"), false);
  assert.equal(isMinorTypo("want", "went"), false);
  assert.equal(isMinorTypo("cut", "cat"), false);
  assert.equal(gradeAnswerDetailed(fill("is"), "it").isCorrect, false);
  assert.equal(gradeAnswerDetailed(fill("beautiful"), "ugly").isCorrect, false);
});

test("exact answers are correct without a typo note", () => {
  assert.deepEqual(gradeAnswerDetailed(fill("has written"), "Has written."), { isCorrect: true });
});

test("skill tags display in Title Case with spaces", () => {
  assert.equal(formatSkillTag("present_continuous"), "Present Continuous");
  assert.equal(formatSkillTag("third_person_singular"), "Third Person Singular");
});
