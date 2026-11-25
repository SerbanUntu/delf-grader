export const maxTotalScore = 25;

export type ScoreBand = "green" | "yellow" | "orange" | "red";

const scoreBands: readonly { band: ScoreBand; minimumScore: number }[] = [
  { band: "green", minimumScore: 20 },
  { band: "yellow", minimumScore: 16 },
  { band: "orange", minimumScore: 12 },
  { band: "red", minimumScore: 0 },
];

const trendThreshold = 0.5;

export type TrendDirection = "up" | "down" | "flat";

/**
 * Finds the color band of a total score out of 25, which colors its progress circle.
 *
 * @param score The total score.
 * @returns The color band.
 */
export function getScoreBand(score: number): ScoreBand {
  return (
    scoreBands.find((candidate) => score >= candidate.minimumScore)?.band ??
    "red"
  );
}

/**
 * Finds which way the arrow of a change between two sessions points. Changes of 0.5 points or less point straight right.
 *
 * @param change The change in points from the previous session.
 * @returns The direction of the arrow.
 */
export function getTrendDirection(change: number): TrendDirection {
  if (change > trendThreshold) {
    return "up";
  }
  if (change < -trendThreshold) {
    return "down";
  }
  return "flat";
}

/**
 * Rounds a score to two decimals, which removes rounding errors such as `17.499999`.
 *
 * @param score The score.
 * @returns The rounded score.
 */
export function roundScore(score: number): number {
  return Math.round(score * 100) / 100;
}

/**
 * Finds the median of a list of scores.
 *
 * @param scores The scores, in any order.
 * @returns The median, or null if there are no scores.
 */
export function getMedian(scores: number[]): number | null {
  if (scores.length === 0) {
    return null;
  }
  const sorted = scores.toSorted((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : roundScore((sorted[middle - 1] + sorted[middle]) / 2);
}
