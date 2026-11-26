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
 * Writes the grader's rules for choosing a level in the new grids, so that the same paper always gets the same level.
 *
 * @param level The CEFR level of the rubric.
 * @returns The rules, as a section of the rubric's system prompt.
 */
export function newGridLevelRules(level: CefrLevel): string {
  const target = `"Au niveau ciblé ${level}"`;
  const above = `"Au niveau ciblé ${level}+"`;
  return `## Choosing a level

For each criterion, choose exactly one level: "Non répondu ou production insuffisante", "En dessous du niveau ciblé", ${target} or ${above}. Choose it by following these steps in order:

1. Split the descriptor of each level into its separate points. A paper reaches a level when it meets every point of that level's descriptor, read with the tolerance the descriptor itself gives (for example "occasional errors that do not hinder understanding").
2. Check ${target} first. If the paper reaches it, check ${above}. If it does not, the level is "En dessous du niveau ciblé".
3. Give ${above} only when the paper meets every point of its descriptor. When it does, give it without hesitating: ${above} does not mean a flawless text.
4. When you cannot tell whether the paper meets a point, treat the point as not met. A paper torn between two levels gets the lower one.
5. Use "Non répondu ou production insuffisante" only when the paper gives nothing to assess for that criterion.`;
}

/**
 * Writes the grader's rules for choosing a score in the old grids, which allow every 0.5 step, so that the same paper always gets the same score.
 *
 * @param level The CEFR level of the rubric.
 * @returns The rules, as a section of the rubric's system prompt.
 */
export function oldGridScoreRules(level: CefrLevel): string {
  return `## Choosing a score

Each descriptor below states what is expected at ${level}. For each criterion, compare the paper with its descriptor and choose the step that fits, as a share of the criterion's maximum:

- The maximum: the paper meets every point of the descriptor. When it does, give the maximum without hesitating, because mistakes that the descriptor allows do not lower the score.
- Three quarters: the paper meets the descriptor overall, with a few shortfalls that do not get in the way of the reader.
- Half: the paper meets the descriptor only in part. The shortfalls are frequent or sometimes get in the way of the reader.
- One quarter: the paper falls clearly short of the descriptor and meets only a few of its points.
- 0: the paper gives nothing to assess for this criterion.

The score is that share of the maximum, rounded down to the nearest 0.5 (for example, three quarters of 3 is 2.25, which gives 2). Use no other score. When you cannot tell which of two steps fits, choose the lower one.`;
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
