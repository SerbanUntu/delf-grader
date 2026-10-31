import { type Infer, v } from "convex/values";
import { z } from "zod";
import { formatNumber } from "./format";
import {
  type AnomalyId,
  anomalyIdValidator,
  type Criterion,
  type CriterionId,
  criterionIdValidator,
  type Rubric,
  rubricIdValidator,
} from "./rubrics";

export const gradingResultValidator = v.object({
  rubricId: rubricIdValidator,
  textType: v.union(v.string(), v.null()),
  anomalies: v.array(anomalyIdValidator),
  criteria: v.array(
    v.object({
      criterionId: criterionIdValidator,
      score: v.number(),
      deductions: v.array(
        v.object({
          points: v.number(),
          reason: v.string(),
          isAutomatic: v.boolean(),
        }),
      ),
    }),
  ),
  totalScore: v.number(),
});

export type GradingResult = Infer<typeof gradingResultValidator>;

type CriterionResult = GradingResult["criteria"][number];

/**
 * An answer from the grader that cannot be turned into a result, with a message that is sent back to the grader.
 */
export class GraderAnswerError extends Error {}

/**
 * Lists the criteria graded by the grader, which are all criteria except the length criterion scored by code.
 *
 * @param rubric The rubric.
 * @returns The criteria graded by the grader.
 */
export function getGradedCriteria(rubric: Rubric): Criterion[] {
  return rubric.criteria.filter(
    (criterion) => criterion.id !== rubric.lengthRule?.criterionId,
  );
}

/**
 * Builds the format of the grader's answer for a rubric.
 *
 * @param rubric The rubric.
 * @returns The schema of the grader's answer.
 */
export function buildGraderSchema(rubric: Rubric) {
  const deduction = z.object({
    points: z.number().describe("The number of points removed, above 0."),
    reason: z
      .string()
      .describe(
        "Why the points are removed, in English, quoting the student's text in French.",
      ),
  });
  return z.object({
    textType: z
      .string()
      .describe(
        'The text type the exam question asks for, in French, such as "lettre formelle".',
      ),
    anomalies: z
      .array(z.enum(rubric.anomalies.map((anomaly) => anomaly.id)))
      .describe("The IDs of the anomalies found in the paper."),
    deductions: z.object(
      Object.fromEntries(
        getGradedCriteria(rubric).map((criterion) => [
          criterion.id,
          z.array(deduction).describe(criterion.frenchName),
        ]),
      ),
    ),
  });
}

export type GraderAnswer = z.infer<ReturnType<typeof buildGraderSchema>>;

function pluralizePoints(points: number): string {
  return `${formatNumber(points)} ${points === 1 ? "point" : "points"}`;
}

function roundScore(score: number): number {
  return Math.round(score * 100) / 100;
}

/**
 * Finds why every criterion of a paper is set to 0 without asking the grader, which happens for blank or far too short papers.
 *
 * @param rubric The rubric.
 * @param wordCount The number of words in the transcription.
 * @returns The reason, or null if the paper must be graded.
 */
export function getAutomaticZeroReason(
  rubric: Rubric,
  wordCount: number,
): string | null {
  if (wordCount === 0) {
    return "Copie blanche: the paper is blank, so every criterion is set to 0.";
  }
  if (
    rubric.tooShortMaxWords !== undefined &&
    wordCount <= rubric.tooShortMaxWords
  ) {
    return `Manque de matière évaluable: the text has ${wordCount} words, which is ${rubric.tooShortMaxWords} or fewer, so every criterion is set to 0.`;
  }
  return null;
}

function scoreLength(
  rubric: Rubric,
  criterion: Criterion,
  wordCount: number,
): CriterionResult {
  const steps = rubric.lengthRule?.steps ?? [];
  const step = steps.findLast(
    (candidate) => wordCount >= candidate.minimumWords,
  );
  const score = step?.score ?? 0;
  const label = criterion.levels.find((level) => level.score === score)?.label;
  return {
    criterionId: criterion.id as CriterionId,
    score,
    deductions:
      score < criterion.maxScore
        ? [
            {
              points: roundScore(criterion.maxScore - score),
              reason: `The text has ${wordCount} words. ${label} gives ${formatNumber(score)}/${formatNumber(criterion.maxScore)}.`,
              isAutomatic: true,
            },
          ]
        : [],
  };
}

function scoreFromAnswer(
  criterion: Criterion,
  answer: GraderAnswer,
): CriterionResult {
  const deductions = answer.deductions[criterion.id] ?? [];
  for (const deduction of deductions) {
    if (!Number.isFinite(deduction.points) || deduction.points <= 0) {
      throw new GraderAnswerError(
        `A deduction under "${criterion.id}" removes ${pluralizePoints(deduction.points)}, but every deduction must remove more than 0 points.`,
      );
    }
  }
  const removed = deductions.reduce((sum, { points }) => sum + points, 0);
  const score = roundScore(criterion.maxScore - removed);
  if (!criterion.levels.some((level) => level.score === score)) {
    const allowed = criterion.levels
      .map((level) => formatNumber(level.score))
      .join(", ");
    throw new GraderAnswerError(
      `The deductions under "${criterion.id}" remove ${pluralizePoints(removed)}, which leaves ${formatNumber(score)}/${formatNumber(criterion.maxScore)}, but the only allowed scores are ${allowed}.`,
    );
  }
  return {
    criterionId: criterion.id as CriterionId,
    score,
    deductions: deductions.map((deduction) => ({
      points: roundScore(deduction.points),
      reason: deduction.reason,
      isAutomatic: false,
    })),
  };
}

function applyCaps(
  rubric: Rubric,
  anomalyIds: AnomalyId[],
  criteria: CriterionResult[],
) {
  for (const anomalyId of anomalyIds) {
    const anomaly = rubric.anomalies.find(
      (candidate) => candidate.id === anomalyId,
    );
    for (const cap of anomaly?.caps ?? []) {
      const result = criteria.find(
        (candidate) => candidate.criterionId === cap.criterionId,
      );
      if (anomaly && result && result.score > cap.maxScore) {
        result.deductions.push({
          points: roundScore(result.score - cap.maxScore),
          reason: `${anomaly.frenchName}: capped at ${pluralizePoints(cap.maxScore)}.`,
          isAutomatic: true,
        });
        result.score = cap.maxScore;
      }
    }
  }
}

/**
 * Computes the score of every criterion from the grader's deductions and the deductions applied by code.
 *
 * @param rubric The rubric.
 * @param wordCount The number of words in the transcription.
 * @param answer The grader's answer, or null if the paper is set to 0 without asking the grader.
 * @returns The grading result.
 * @throws A GraderAnswerError if the grader's deductions lead to a score that the rubric does not allow.
 */
export function computeGradingResult(
  rubric: Rubric,
  wordCount: number,
  answer: GraderAnswer | null,
): GradingResult {
  const zeroReason = getAutomaticZeroReason(rubric, wordCount);
  if (!zeroReason && !answer) {
    throw new Error("The paper must be graded by the grader.");
  }
  const anomalies = [...new Set(answer?.anomalies ?? [])] as AnomalyId[];
  const criteria = rubric.criteria.map((criterion): CriterionResult => {
    if (zeroReason || !answer) {
      return {
        criterionId: criterion.id as CriterionId,
        score: 0,
        deductions: [
          {
            points: criterion.maxScore,
            reason: zeroReason ?? "",
            isAutomatic: true,
          },
        ],
      };
    }
    if (criterion.id === rubric.lengthRule?.criterionId) {
      return scoreLength(rubric, criterion, wordCount);
    }
    return scoreFromAnswer(criterion, answer);
  });
  applyCaps(rubric, anomalies, criteria);
  return {
    rubricId: rubric.id as GradingResult["rubricId"],
    textType: answer?.textType ?? null,
    anomalies,
    criteria,
    totalScore: roundScore(
      criteria.reduce((sum, criterion) => sum + criterion.score, 0),
    ),
  };
}
