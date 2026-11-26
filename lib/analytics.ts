import type { GradingResult } from "./grading";
import type { AnomalyId, CriterionId, Rubric } from "./rubrics";
import { roundScore } from "./scores";

/**
 * The aggregates of one rubric criterion over the graded submissions of a session.
 */
export interface CriterionAnalytics {
  criterionId: CriterionId;
  lostPointsCount: number;
  totalPointsLost: number;
  averagePointsLost: number;
  scoreCounts: { score: number; count: number }[];
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
    const scores = graded.flatMap(
      (result) =>
        result.criteria.find(
          (candidate) => candidate.criterionId === criterion.id,
        )?.score ?? [],
    );
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
