import { v } from "convex/values";
import {
  type AnalyticsCriterion,
  analyticsCriteria,
  type MistakeCategory,
  type MistakeCategoryId,
} from "./analytics-criteria";
import type { Criterion, Rubric } from "./base";
import { newB1 } from "./new-b1";
import { newB2 } from "./new-b2";
import { oldB1 } from "./old-b1";
import { oldB2 } from "./old-b2";

export * from "./analytics-criteria";
export * from "./base";

export const rubrics = [oldB1, oldB2, newB1, newB2] as const;

export type RubricId = (typeof rubrics)[number]["id"];

export type CriterionId = (typeof rubrics)[number]["criteria"][number]["id"];

export type AnomalyId = (typeof rubrics)[number]["anomalies"][number]["id"];

export const rubricIdValidator = v.union(
  ...rubrics.map((rubric) => v.literal(rubric.id)),
);

const criterionIds = new Set<CriterionId>(
  rubrics.flatMap((rubric) => rubric.criteria.map((criterion) => criterion.id)),
);

const anomalyIds = new Set<AnomalyId>(
  rubrics.flatMap((rubric) => rubric.anomalies.map((anomaly) => anomaly.id)),
);

export const criterionIdValidator = v.union(
  ...Array.from(criterionIds, (id) => v.literal(id)),
);

export const anomalyIdValidator = v.union(
  ...Array.from(anomalyIds, (id) => v.literal(id)),
);

const mistakeCategories = analyticsCriteria.flatMap<MistakeCategory>(
  (analyticsCriterion) => analyticsCriterion.categories,
);

const mistakeCategoryIds = analyticsCriteria.flatMap<MistakeCategoryId>(
  (analyticsCriterion) =>
    analyticsCriterion.categories.map((category) => category.id),
);

export const mistakeCategoryIdValidator = v.union(
  ...mistakeCategoryIds.map((id) => v.literal(id)),
);

/**
 * Finds the analytics criterion that a rubric criterion counts towards.
 *
 * @param criterion The rubric criterion.
 * @returns The analytics criterion.
 * @throws If no analytics criterion has the ID named by the criterion.
 */
export function getAnalyticsCriterion(
  criterion: Criterion,
): AnalyticsCriterion {
  const analyticsCriterion = analyticsCriteria.find(
    (candidate) => candidate.id === criterion.analyticsCriterionId,
  );
  if (!analyticsCriterion) {
    throw new Error(
      `Unknown analytics criterion: ${criterion.analyticsCriterionId}`,
    );
  }
  return analyticsCriterion;
}

/**
 * Lists the mistake categories a rubric criterion allows, which are those of its analytics criterion.
 *
 * @param criterion The rubric criterion.
 * @returns The allowed mistake categories.
 */
export function getMistakeCategories(
  criterion: Criterion,
): readonly MistakeCategory[] {
  return getAnalyticsCriterion(criterion).categories;
}

/**
 * Finds a mistake category by its ID.
 *
 * @param id The mistake category ID.
 * @returns The mistake category.
 * @throws If no mistake category has this ID.
 */
export function getMistakeCategory(id: MistakeCategoryId): MistakeCategory {
  const category = mistakeCategories.find((candidate) => candidate.id === id);
  if (!category) {
    throw new Error(`Unknown mistake category: ${id}`);
  }
  return category;
}

/**
 * Finds a rubric by its ID.
 *
 * @param id The rubric ID.
 * @returns The rubric.
 * @throws If no rubric has this ID.
 */
export function getRubric(id: RubricId): Rubric {
  const rubric = rubrics.find((candidate) => candidate.id === id);
  if (!rubric) {
    throw new Error(`Unknown rubric: ${id}`);
  }
  return rubric;
}

/**
 * Finds the level label of a criterion's score, such as "Au niveau ciblé B1".
 *
 * @param criterion The criterion.
 * @param score One of the criterion's allowed scores.
 * @returns The level label.
 * @throws If the criterion does not allow this score.
 */
export function getLevelLabel(criterion: Criterion, score: number): string {
  const level = criterion.levels.find((candidate) => candidate.score === score);
  if (!level) {
    throw new Error(
      `${criterion.frenchName} does not allow a score of ${score}.`,
    );
  }
  return level.label;
}
