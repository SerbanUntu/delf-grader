import type { ReactNode } from "react";
import type { MistakeCategoryCount } from "@/lib/analytics";
import { formatNumber } from "@/lib/format";
import { getMistakeCategory } from "@/lib/rubrics";

/**
 * Writes a number of submissions, such as "1 submission" or "3 submissions".
 *
 * @param count The number of submissions.
 * @returns The text.
 */
export function pluralizeSubmissions(count: number): string {
  return `${count} ${count === 1 ? "submission" : "submissions"}`;
}

/**
 * Writes a number of points, such as "1 point" or "2.5 points".
 *
 * @param points The number of points.
 * @returns The text.
 */
export function pluralizePoints(points: number): string {
  return `${formatNumber(points)} ${points === 1 ? "point" : "points"}`;
}

/**
 * One statistic in a grey box, with its name above its value.
 *
 * @param term The name of the statistic.
 * @param children The value.
 */
export function Stat({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

/**
 * The mistake categories found in a group of submissions, with how many submissions have each one and the points removed.
 *
 * @param counts The categories found, in the order they are shown.
 */
export function MistakeCategoryList({
  counts,
}: {
  counts: MistakeCategoryCount[];
}) {
  return (
    <ul className="grid gap-2">
      {counts.map(({ categoryId, submissionCount, pointsRemoved }) => {
        const category = getMistakeCategory(categoryId);
        return (
          <li
            key={categoryId}
            className="flex flex-wrap items-baseline justify-between gap-x-4"
          >
            <span>
              <span className="font-medium">{category.frenchName}</span>{" "}
              <span className="text-muted-foreground">
                ({category.englishSubtitle})
              </span>
            </span>
            <span className="tabular-nums">
              {pluralizeSubmissions(submissionCount)},{" "}
              {pluralizePoints(pointsRemoved)} removed
            </span>
          </li>
        );
      })}
    </ul>
  );
}
