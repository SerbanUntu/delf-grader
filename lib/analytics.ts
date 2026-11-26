import type { GradingResult } from "./grading";
import {
  type AnalyticsCriterionId,
  type AnomalyId,
  analyticsCriteria,
  type CriterionId,
  getRubric,
  type MistakeCategoryId,
  type Rubric,
} from "./rubrics";
import { roundScore } from "./scores";

type Deduction = GradingResult["criteria"][number]["deductions"][number];

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
 * The aggregates of the graded submissions of a session, which never identify a submission or a student.
 */
export interface SessionAnalytics {
  gradedCount: number;
  criteria: CriterionAnalytics[];
  anomalies: { anomalyId: AnomalyId; count: number }[];
}

/**
 * Computes the aggregates of a session for every criterion and anomaly of its rubric.
 *
 * @param rubric The rubric of the session.
 * @param results The grading results of the session's submissions. Results graded with another rubric are left out.
 * @returns The aggregates.
 */
export function computeSessionAnalytics(
  rubric: Rubric,
  results: GradingResult[],
): SessionAnalytics {
  const graded = results.filter((result) => result.rubricId === rubric.id);
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
  const anomalies = rubric.anomalies.map((anomaly) => ({
    anomalyId: anomaly.id as AnomalyId,
    count: graded.filter((result) =>
      result.anomalies.some((anomalyId) => anomalyId === anomaly.id),
    ).length,
  }));
  return { gradedCount: graded.length, criteria, anomalies };
}

/**
 * The share of points kept in each analytics criterion of one exam, from 0 to 100. Analytics criteria that the exam's rubric has no criterion for are missing.
 */
export type PercentsKept = Partial<Record<AnalyticsCriterionId, number>>;

/**
 * Computes the share of points kept in each analytics criterion of a grading result, which is the sum of the scores of its rubric criteria as a percentage of the sum of their maximums.
 *
 * @param result The grading result.
 * @returns The percentages, by analytics criterion.
 */
export function getPercentsKept(result: GradingResult): PercentsKept {
  const rubric = getRubric(result.rubricId);
  const percents: PercentsKept = {};
  for (const analyticsCriterion of analyticsCriteria) {
    let score = 0;
    let maxScore = 0;
    for (const criterion of rubric.criteria) {
      const criterionResult = result.criteria.find(
        (candidate) => candidate.criterionId === criterion.id,
      );
      if (
        criterion.analyticsCriterionId === analyticsCriterion.id &&
        criterionResult
      ) {
        score += criterionResult.score;
        maxScore += criterion.maxScore;
      }
    }
    if (maxScore > 0) {
      percents[analyticsCriterion.id] = roundScore((score / maxScore) * 100);
    }
  }
  return percents;
}

/**
 * The aggregates of one analytics criterion over the graded exams of a student.
 */
export interface StudentCriterionAnalytics {
  analyticsCriterionId: AnalyticsCriterionId;
  examCount: number;
  averagePercentKept: number;
}

/**
 * Computes the statistics of a student over their graded exams, which can use different rubrics.
 *
 * @param results The grading results of the student's exams.
 * @returns For each analytics criterion that at least one exam has, the average percentage of points kept, and the mistake categories found, sorted from the most to the fewest exams.
 */
export function computeStudentAnalytics(results: GradingResult[]) {
  const percents = results.map(getPercentsKept);
  const criteria = analyticsCriteria.flatMap(
    (analyticsCriterion): StudentCriterionAnalytics[] => {
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
          averagePercentKept: roundScore(total / values.length),
        },
      ];
    },
  );
  const mistakeCategories = countMistakeCategories(
    results.map((result) =>
      result.criteria.flatMap((criterion) => criterion.deductions),
    ),
  );
  return { criteria, mistakeCategories };
}
