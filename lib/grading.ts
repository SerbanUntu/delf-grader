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
  type RubricId,
  rubricIdValidator,
} from "./rubrics";
import { roundScore } from "./scores";

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

type GradingInput = { rubricId: RubricId; question: string };

/**
 * Checks whether a change to an exam changes what the grader receives, which are the rubric and the question.
 *
 * @param before The exam before the change.
 * @param after The exam after the change.
 * @returns Whether submissions that were graded must be graded again.
 */
export function isGradingInputChanged(
  before: GradingInput,
  after: GradingInput,
): boolean {
  return (
    before.rubricId !== after.rubricId || before.question !== after.question
  );
}

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
    criteria: z.object(
      Object.fromEntries(
        getGradedCriteria(rubric).map((criterion) => [
          criterion.id,
          z
            .object({
              comparison: z
                .string()
                .describe(
                  "Two to four sentences comparing the paper with the descriptors of the chosen level and of the level above it, quoting the student's text as evidence.",
                ),
              score: z
                .number()
                .describe(
                  `The score of the chosen level, one of ${formatAllowedScores(criterion)}.`,
                ),
              deductions: z
                .array(deduction)
                .describe(
                  "The deductions that explain the gap between the maximum and the chosen score. Empty when the score is the maximum.",
                ),
            })
            .describe(criterion.frenchName),
        ]),
      ),
    ),
  });
}

export type GraderAnswer = z.infer<ReturnType<typeof buildGraderSchema>>;

function pluralizePoints(points: number): string {
  return `${formatNumber(points)} ${points === 1 ? "point" : "points"}`;
}

/**
 * Lists the scores a criterion allows, such as "0, 1, 3, 5".
 *
 * @param criterion The criterion.
 * @returns The allowed scores, separated by commas.
 */
export function formatAllowedScores(criterion: Criterion): string {
  return criterion.levels.map((level) => formatNumber(level.score)).join(", ");
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
  const criterionAnswer = answer.criteria[criterion.id];
  if (!criterionAnswer) {
    throw new GraderAnswerError(
      `The answer does not grade the criterion "${criterion.id}".`,
    );
  }
  const { score, deductions } = criterionAnswer;
  const maximum = formatNumber(criterion.maxScore);
  if (!criterion.levels.some((level) => level.score === score)) {
    throw new GraderAnswerError(
      `The score chosen for "${criterion.id}" is ${formatNumber(score)}/${maximum}, but the only allowed scores are ${formatAllowedScores(criterion)}.`,
    );
  }
  for (const deduction of deductions) {
    if (!Number.isFinite(deduction.points) || deduction.points <= 0) {
      throw new GraderAnswerError(
        `A deduction under "${criterion.id}" removes ${pluralizePoints(deduction.points)}, but every deduction must remove more than 0 points.`,
      );
    }
  }
  const removed = roundScore(
    deductions.reduce((sum, { points }) => sum + points, 0),
  );
  const gap = roundScore(criterion.maxScore - score);
  if (removed !== gap) {
    throw new GraderAnswerError(
      `The deductions under "${criterion.id}" remove ${pluralizePoints(removed)}, but the chosen score of ${formatNumber(score)}/${maximum} needs them to remove exactly ${pluralizePoints(gap)}.`,
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
 * Computes the score of every criterion from the grader's chosen scores and deductions, and the deductions applied by code.
 *
 * @param rubric The rubric.
 * @param wordCount The number of words in the transcription.
 * @param answer The grader's answer, or null if the paper is set to 0 without asking the grader.
 * @returns The grading result.
 * @throws A GraderAnswerError if a chosen score is not allowed by the rubric, or if its deductions do not add up to the gap between the maximum and that score.
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
