export type CefrLevel = "B1" | "B2";

export interface ScoreLevel {
  score: number;
  label: string;
}

export interface LengthStep {
  minimumWords: number;
  score: number;
}

export interface Criterion {
  id: string;
  frenchName: string;
  englishSubtitle: string;
  maxScore: number;
  levels: readonly ScoreLevel[];
}

export interface Anomaly {
  id: string;
  frenchName: string;
  englishSubtitle: string;
  caps: readonly { criterionId: string; maxScore: number }[];
}

/**
 * A fixed DELF Production écrite grid, with its criteria, the rules applied by code and the grader's instructions.
 */
export interface Rubric {
  id: string;
  name: string;
  level: CefrLevel;
  grid: "old" | "new";
  minimumWords: number;
  lengthRule?: { criterionId: string; steps: readonly LengthStep[] };
  tooShortMaxWords?: number;
  criteria: readonly Criterion[];
  anomalies: readonly Anomaly[];
  systemPrompt: string;
}

const unansweredLabel = "Non répondu ou production insuffisante";
const belowLevelLabel = "En dessous du niveau ciblé";

/**
 * Lists the four bands of the new grids: 0, 1, 3 and 5 points.
 *
 * @param level The CEFR level of the rubric.
 * @returns The allowed scores with their labels.
 */
export function bandLevels(level: CefrLevel): ScoreLevel[] {
  return [
    { score: 0, label: unansweredLabel },
    { score: 1, label: belowLevelLabel },
    { score: 3, label: `Au niveau ciblé ${level}` },
    { score: 5, label: `Au niveau ciblé ${level}+` },
  ];
}

/**
 * Lists every 0.5 step from 0 to the maximum, as allowed by the old grids.
 *
 * @param maxScore The maximum score of the criterion.
 * @param level The CEFR level of the rubric.
 * @returns The allowed scores with their labels.
 */
export function halfPointLevels(
  maxScore: number,
  level: CefrLevel,
): ScoreLevel[] {
  return Array.from({ length: maxScore * 2 + 1 }, (_, index) => {
    const score = index / 2;
    if (score === 0) {
      return { score, label: unansweredLabel };
    }
    if (score < maxScore / 2) {
      return { score, label: belowLevelLabel };
    }
    return { score, label: `Au niveau ciblé ${level}` };
  });
}

/**
 * Lists the scores of a length criterion, labeled with the word counts that give them.
 *
 * @param steps The length steps, sorted from the lowest to the highest number of words.
 * @returns The allowed scores with their labels.
 */
export function lengthLevels(steps: readonly LengthStep[]): ScoreLevel[] {
  return steps.map((step, index) => {
    const nextStep = steps[index + 1];
    if (!nextStep) {
      return { score: step.score, label: `${step.minimumWords} words or more` };
    }
    const maximumWords = nextStep.minimumWords - 1;
    if (step.minimumWords === 0) {
      return { score: step.score, label: `${maximumWords} words or fewer` };
    }
    return {
      score: step.score,
      label: `${step.minimumWords} to ${maximumWords} words`,
    };
  });
}
