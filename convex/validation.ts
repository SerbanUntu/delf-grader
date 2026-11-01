import { ConvexError } from "convex/values";
import { isIsoDate, maxNameLength, maxQuestionLength } from "../lib/format";
import type { RubricId } from "../lib/rubrics";
import { isHash } from "../lib/student-ids";

export const listLimit = 500;

/**
 * Trims a name and checks its length.
 *
 * @param name The name typed by the teacher.
 * @returns The trimmed name, which may be empty.
 * @throws If the name is too long.
 */
export function cleanName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length > maxNameLength) {
    throw new ConvexError(
      `The name must be at most ${maxNameLength} characters long.`,
    );
  }
  return trimmed;
}

/**
 * Trims a name that must not be empty and checks its length.
 *
 * @param name The name typed by the teacher.
 * @returns The trimmed name.
 * @throws If the name is empty or too long.
 */
export function cleanRequiredName(name: string): string {
  const trimmed = cleanName(name);
  if (!trimmed) {
    throw new ConvexError("The name is required.");
  }
  return trimmed;
}

export type Exam = {
  examDate: string;
  rubricId: RubricId;
  question: string;
};

/**
 * Checks the exam date and the exam question shared by sessions and individual submissions.
 *
 * @param exam The exam date, rubric and question, possibly among other fields.
 * @returns Only the exam fields, with the question trimmed.
 * @throws If the date is not valid, or the question is empty or too long.
 */
export function cleanExam(exam: Exam): Exam {
  if (!isIsoDate(exam.examDate)) {
    throw new ConvexError("The exam date is not valid.");
  }
  const question = exam.question.trim();
  if (!question) {
    throw new ConvexError("The exam question is required.");
  }
  if (question.length > maxQuestionLength) {
    throw new ConvexError(
      `The exam question must be at most ${maxQuestionLength} characters long.`,
    );
  }
  return { examDate: exam.examDate, rubricId: exam.rubricId, question };
}

/**
 * Checks that a student ID computed in the browser has the right form.
 *
 * @param value The student ID, or undefined when there is none.
 * @returns The same value.
 * @throws If the value is not a valid student ID.
 */
export function cleanStudentId(value: string | undefined): string | undefined {
  if (value !== undefined && !isHash(value)) {
    throw new ConvexError("The student ID is not valid.");
  }
  return value;
}
