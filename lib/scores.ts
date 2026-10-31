export const maxTotalScore = 25;

export type ScoreBand = "green" | "yellow" | "orange" | "red";

const scoreBands: readonly { band: ScoreBand; minimumScore: number }[] = [
  { band: "green", minimumScore: 20 },
  { band: "yellow", minimumScore: 16 },
  { band: "orange", minimumScore: 12 },
  { band: "red", minimumScore: 0 },
];

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
