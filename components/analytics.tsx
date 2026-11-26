import type { ReactNode } from "react";
import type { AnomalyCount, MistakeCategoryCount } from "@/lib/analytics";
import { formatNumber } from "@/lib/format";
import { getAnomaly, getMistakeCategory } from "@/lib/rubrics";

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
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

/**
 * Writes how many submissions are being graded and are not counted yet.
 *
 * @param pendingCount The number of submissions being graded or re-graded.
 * @returns The text, or null when no submission is being graded.
 */
export function getPendingMessage(pendingCount: number): string | null {
  return pendingCount > 0
    ? `${pluralizeSubmissions(pendingCount)} ${pendingCount === 1 ? "is" : "are"} being graded and will be included once grading is done.`
    : null;
}

/**
 * The message shown in place of analytics when no submission is graded yet.
 *
 * @param message What makes analytics appear.
 * @param pendingCount The number of submissions being graded or re-graded.
 */
export function EmptyAnalytics({
  message,
  pendingCount,
}: {
  message: string;
  pendingCount: number;
}) {
  const pendingMessage = getPendingMessage(pendingCount);
  return (
    <div className="rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
      <p>{message}</p>
      {pendingMessage && <p className="mt-2">{pendingMessage}</p>}
    </div>
  );
}

/**
 * A card of a list of criteria, with the criterion's French name and English subtitle as its heading.
 *
 * @param frenchName The French name of the criterion.
 * @param englishSubtitle The English subtitle of the criterion.
 * @param aside A short text shown right of the heading.
 * @param children The statistics of the criterion.
 */
export function CriterionCard({
  frenchName,
  englishSubtitle,
  aside,
  children,
}: {
  frenchName: string;
  englishSubtitle: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="min-w-0 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-semibold">{frenchName}</h3>
          <p className="text-muted-foreground">{englishSubtitle}</p>
        </div>
        {aside && (
          <p className="shrink-0 text-muted-foreground tabular-nums">{aside}</p>
        )}
      </div>
      {children}
    </li>
  );
}

/**
 * The note shown under an analytics criterion when some exams were graded with a rubric that has no criterion for it.
 *
 * @param examCount The number of exams that have the criterion.
 * @param totalCount The number of exams.
 */
export function MissingCriterionNote({
  examCount,
  totalCount,
}: {
  examCount: number;
  totalCount: number;
}) {
  if (examCount >= totalCount) {
    return null;
  }
  return (
    <p className="mt-3 text-muted-foreground">
      Based on {examCount} of {pluralizeSubmissions(totalCount)}. The rubric of
      the others has no criterion for it.
    </p>
  );
}

/**
 * The anomalies of a group of submissions, with how many submissions each one was found in.
 *
 * @param anomalies The anomalies with their counts, in the order they are shown.
 */
export function AnomalyList({ anomalies }: { anomalies: AnomalyCount[] }) {
  if (anomalies.length === 0) {
    return null;
  }
  return (
    <section className="rounded-xl border bg-card p-5">
      <h3 className="text-lg leading-snug font-semibold">Anomalies</h3>
      <ul className="mt-3 grid gap-2">
        {anomalies.map(({ anomalyId, count }) => {
          const anomaly = getAnomaly(anomalyId);
          return (
            <li
              key={anomalyId}
              className="flex flex-wrap items-baseline justify-between gap-x-4"
            >
              <span>
                <span className="font-medium">{anomaly.frenchName}</span>{" "}
                <span className="text-muted-foreground">
                  ({anomaly.englishSubtitle})
                </span>
              </span>
              <span
                className={
                  count > 0
                    ? "font-semibold tabular-nums"
                    : "text-muted-foreground tabular-nums"
                }
              >
                {pluralizeSubmissions(count)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
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

/**
 * The mistake categories of one criterion, shown at the bottom of its card when there are any.
 *
 * @param counts The categories found, in the order they are shown.
 */
export function CriterionMistakeCategories({
  counts,
}: {
  counts: MistakeCategoryCount[];
}) {
  if (counts.length === 0) {
    return null;
  }
  return (
    <section className="mt-5">
      <h4 className="mb-2 font-medium">Mistake categories</h4>
      <MistakeCategoryList counts={counts} />
    </section>
  );
}
