import type { GradingResult } from "./grading";
import {
  type AnalyticsCriterionId,
  type AnomalyId,
  analyticsCriteria,
  type CriterionId,
  getRubric,
  type MistakeCategoryId,
  type Rubric,
  rubrics,
} from "./rubrics";
import { roundScore } from "./scores";

type Deduction = GradingResult["criteria"][number]["deductions"][number];

export const defaultClassAnalyticsSessionCount = 5;

export const maxClassAnalyticsSessionCount = 50;

/**
 * Keeps the number of sessions covered by class analytics between 1 and the maximum.
 *
 * @param count The number of sessions asked for.
 * @returns A whole number from 1 to the maximum, or the default when the number is not valid.
 */
export function clampClassAnalyticsSessionCount(count: number): number {
  if (Number.isNaN(count)) {
    return defaultClassAnalyticsSessionCount;
  }
  return Math.min(
    Math.max(Math.round(count), 1),
    maxClassAnalyticsSessionCount,
  );
}

/**
 * How often a mistake category appears in a group of submissions.
 */
export interface MistakeCategoryCount {
  categoryId: MistakeCategoryId;
  submissionCount: number;
  pointsRemoved: number;
}

/**
 * Counts, for each mistake category, how many submissions have a deduction in it and the points those deductions removed. Automatic deductions and deductions saved without categories are not counted.
 *
 * @param deductionsBySubmission The deductions of each submission.
 * @returns The categories found, sorted from the most to the fewest submissions.
 */
export function countMistakeCategories(
  deductionsBySubmission: Deduction[][],
): MistakeCategoryCount[] {
  const counts = new Map<MistakeCategoryId, MistakeCategoryCount>();
  for (const deductions of deductionsBySubmission) {
    const seen = new Set<MistakeCategoryId>();
    for (const deduction of deductions) {
      if (deduction.isAutomatic) {
        continue;
      }
      for (const categoryId of deduction.categories ?? []) {
        const count = counts.get(categoryId) ?? {
          categoryId,
          submissionCount: 0,
          pointsRemoved: 0,
        };
        count.pointsRemoved = roundScore(
          count.pointsRemoved + deduction.points,
        );
        if (!seen.has(categoryId)) {
          seen.add(categoryId);
          count.submissionCount++;
        }
        counts.set(categoryId, count);
      }
    }
  }
  return Array.from(counts.values()).toSorted(
    (first, second) =>
      second.submissionCount - first.submissionCount ||
      second.pointsRemoved - first.pointsRemoved,
  );
}

/**
 * The aggregates of one rubric criterion over the graded submissions of a session.
 */
export interface CriterionAnalytics {
  criterionId: CriterionId;
  lostPointsCount: number;
  totalPointsLost: number;
  averagePointsLost: number;
  scoreCounts: { score: number; count: number }[];
  mistakeCategories: MistakeCategoryCount[];
}

/**
 * How many submissions an anomaly was found in.
 */
export interface AnomalyCount {
  anomalyId: AnomalyId;
  count: number;
}

/**
 * Counts how many grading results each anomaly of the given rubrics was found in. An anomaly that several rubrics share is listed once.
 *
 * @param usedRubrics The rubrics whose anomalies are listed, in the order they are shown.
 * @param results The grading results.
 * @returns The anomalies with their counts, including those never found.
 */
export function countAnomalies(
  usedRubrics: readonly Rubric[],
  results: GradingResult[],
): AnomalyCount[] {
  const anomalyIds = new Set(
    usedRubrics.flatMap((rubric) =>
      rubric.anomalies.map((anomaly) => anomaly.id as AnomalyId),
    ),
  );
  return Array.from(anomalyIds, (anomalyId) => ({
    anomalyId,
    count: results.filter((result) => result.anomalies.includes(anomalyId))
      .length,
  }));
}

/**
 * The aggregates of the graded submissions of a session, which never identify a submission or a student.
 */
export interface SessionAnalytics {
  gradedCount: number;
  criteria: CriterionAnalytics[];
  anomalies: AnomalyCount[];
}

/**
 * Computes the aggregates of a session for every criterion and anomaly of its rubric.
 *
 * @param rubric The rubric of the session.
 * @param graded The grading results of the session's submissions, all graded with its rubric.
 * @returns The aggregates.
 */
export function computeSessionAnalytics(
  rubric: Rubric,
  graded: GradingResult[],
): SessionAnalytics {
  const criteria = rubric.criteria.map((criterion): CriterionAnalytics => {
    const criterionResults = graded.flatMap(
      (result) =>
        result.criteria.find(
          (candidate) => candidate.criterionId === criterion.id,
        ) ?? [],
    );
    const scores = criterionResults.map((result) => result.score);
    const pointsLost = scores.map((score) =>
      roundScore(criterion.maxScore - score),
    );
    const totalPointsLost = roundScore(
      pointsLost.reduce((sum, points) => sum + points, 0),
    );
    return {
      criterionId: criterion.id as CriterionId,
      lostPointsCount: pointsLost.filter((points) => points > 0).length,
      totalPointsLost,
      averagePointsLost:
        scores.length > 0 ? roundScore(totalPointsLost / scores.length) : 0,
      scoreCounts: criterion.levels.map((level) => ({
        score: level.score,
        count: scores.filter((score) => score === level.score).length,
      })),
      mistakeCategories: countMistakeCategories(
        criterionResults.map((result) => result.deductions),
      ),
    };
  });
  return {
    gradedCount: graded.length,
    criteria,
    anomalies: countAnomalies([rubric], graded),
  };
}

/**
 * The share of points kept in each analytics criterion of one exam, from 0 to 100. Analytics criteria that the exam's rubric has no criterion for are missing.
 */
export type PercentsKept = Partial<Record<AnalyticsCriterionId, number>>;

function getAnalyticsCriterionResults(
  result: GradingResult,
  analyticsCriterionId: AnalyticsCriterionId,
) {
  return getRubric(result.rubricId).criteria.flatMap((criterion) => {
    const criterionResult = result.criteria.find(
      (candidate) => candidate.criterionId === criterion.id,
    );
    return criterion.analyticsCriterionId === analyticsCriterionId &&
      criterionResult
      ? [{ ...criterionResult, maxScore: criterion.maxScore }]
      : [];
  });
}

/**
 * Computes the share of points kept in each analytics criterion of a grading result, which is the sum of the scores of its rubric criteria as a percentage of the sum of their maximums.
 *
 * @param result The grading result.
 * @returns The percentages, by analytics criterion.
 */
export function getPercentsKept(result: GradingResult): PercentsKept {
  const percents: PercentsKept = {};
  for (const analyticsCriterion of analyticsCriteria) {
    const criterionResults = getAnalyticsCriterionResults(
      result,
      analyticsCriterion.id,
    );
    const score = criterionResults.reduce((sum, { score }) => sum + score, 0);
    const maxScore = criterionResults.reduce(
      (sum, { maxScore }) => sum + maxScore,
      0,
    );
    if (maxScore > 0) {
      percents[analyticsCriterion.id] = roundScore((score / maxScore) * 100);
    }
  }
  return percents;
}

/**
 * The aggregates of one analytics criterion over graded exams that can use different rubrics.
 */
export interface AnalyticsCriterionSummary {
  analyticsCriterionId: AnalyticsCriterionId;
  examCount: number;
  lostPointsCount: number;
  averagePercentKept: number;
  mistakeCategories: MistakeCategoryCount[];
}

/**
 * Computes the aggregates of each analytics criterion over graded exams that can use different rubrics. Exams whose rubric has no criterion for an analytics criterion are left out of it.
 *
 * @param results The grading results of the exams.
 * @returns For each analytics criterion that at least one exam has, how many exams have it and lost points on it, the average percentage of points kept and the mistake categories found.
 */
export function summarizeAnalyticsCriteria(
  results: GradingResult[],
): AnalyticsCriterionSummary[] {
  const percents = results.map(getPercentsKept);
  return analyticsCriteria.flatMap(
    (analyticsCriterion): AnalyticsCriterionSummary[] => {
      const values = percents.flatMap(
        (examPercents) => examPercents[analyticsCriterion.id] ?? [],
      );
      if (values.length === 0) {
        return [];
      }
      const total = values.reduce((sum, value) => sum + value, 0);
      return [
        {
          analyticsCriterionId: analyticsCriterion.id,
          examCount: values.length,
          lostPointsCount: values.filter((value) => value < 100).length,
          averagePercentKept: roundScore(total / values.length),
          mistakeCategories: countMistakeCategories(
            results.map((result) =>
              getAnalyticsCriterionResults(
                result,
                analyticsCriterion.id,
              ).flatMap(({ deductions }) => deductions),
            ),
          ),
        },
      ];
    },
  );
}

/**
 * Computes the statistics of a student over their graded exams, which can use different rubrics.
 *
 * @param results The grading results of the student's exams.
 * @returns The aggregates of each analytics criterion, and the mistake categories found over all criteria, sorted from the most to the fewest exams.
 */
export function computeStudentAnalytics(results: GradingResult[]) {
  return {
    criteria: summarizeAnalyticsCriteria(results),
    mistakeCategories: countMistakeCategories(
      results.map((result) =>
        result.criteria.flatMap((criterion) => criterion.deductions),
      ),
    ),
  };
}

/**
 * Computes the aggregates of recent graded exams of a class, which can use different rubrics and never identify a submission or a student.
 *
 * @param results The grading results of the exams.
 * @returns The number of exams, the aggregates of each analytics criterion and how many exams each anomaly of their rubrics was found in.
 */
export function computeClassAnalytics(results: GradingResult[]) {
  const usedRubrics = rubrics.filter((rubric) =>
    results.some((result) => result.rubricId === rubric.id),
  );
  return {
    gradedCount: results.length,
    criteria: summarizeAnalyticsCriteria(results),
    anomalies: countAnomalies(usedRubrics, results),
  };
}
