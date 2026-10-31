import { z } from "zod";
import { isIsoDate, maxNameLength, maxQuestionLength } from "./format";
import { type RubricId, rubrics } from "./rubrics";

export const optionalNameSchema = z
  .string()
  .trim()
  .max(
    maxNameLength,
    `The name must be at most ${maxNameLength} characters long.`,
  );

export const requiredNameSchema = optionalNameSchema.min(
  1,
  "The name is required.",
);

export const examSchema = z.object({
  examDate: z.string().refine(isIsoDate, "Pick the exam date."),
  rubricId: z.custom<RubricId>(
    (value) => rubrics.some((rubric) => rubric.id === value),
    "Choose a rubric.",
  ),
  question: z
    .string()
    .trim()
    .min(1, "Paste the exam question.")
    .max(
      maxQuestionLength,
      `The exam question must be at most ${maxQuestionLength} characters long.`,
    ),
});

export type ExamValues = z.infer<typeof examSchema>;
