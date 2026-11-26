"use client";

import { useQuery } from "convex/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  MistakeCategoryList,
  pluralizeSubmissions,
  Stat,
} from "@/components/analytics";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { CriterionAnalytics } from "@/lib/analytics";
import { formatNumber } from "@/lib/format";
import { type Criterion, getLevelLabel, getRubric } from "@/lib/rubrics";
import { getLevelBarColor } from "@/lib/scores";

const chartConfig = {
  count: { label: "Submissions" },
} satisfies ChartConfig;

/**
 * The "Analytics" tab of a session, with aggregates of its graded submissions for every criterion and anomaly of its rubric.
 *
 * @param sessionId The session ID.
 */
export function SessionAnalytics({ sessionId }: { sessionId: Id<"sessions"> }) {
  const analytics = useQuery(api.sessions.getAnalytics, { sessionId });

  if (analytics === undefined) {
    return null;
  }

  const pendingMessage =
    analytics && analytics.pendingCount > 0
      ? `${pluralizeSubmissions(analytics.pendingCount)} ${analytics.pendingCount === 1 ? "is" : "are"} being graded and will be included once grading is done.`
      : null;

  if (!analytics || analytics.gradedCount === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
        <p>Analytics will appear here once submissions are graded.</p>
        {pendingMessage && <p className="mt-2">{pendingMessage}</p>}
      </div>
    );
  }

  const rubric = getRubric(analytics.rubricId);

  return (
    <div className="grid gap-6">
      <div className="text-muted-foreground">
        <p>
          Based on {pluralizeSubmissions(analytics.gradedCount)} graded with the{" "}
          {rubric.name} rubric.
        </p>
        {pendingMessage && <p>{pendingMessage}</p>}
      </div>

      <ol className="grid gap-4 lg:grid-cols-2">
        {analytics.criteria.map((criterionAnalytics) => {
          const criterion = rubric.criteria.find(
            (candidate) => candidate.id === criterionAnalytics.criterionId,
          );
          return (
            criterion && (
              <CriterionView
                key={criterion.id}
                criterion={criterion}
                analytics={criterionAnalytics}
                gradedCount={analytics.gradedCount}
              />
            )
          );
        })}
      </ol>

      {analytics.anomalies.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <h3 className="text-lg leading-snug font-semibold">Anomalies</h3>
          <ul className="mt-3 grid gap-2">
            {analytics.anomalies.map(({ anomalyId, count }) => {
              const anomaly = rubric.anomalies.find(
                (candidate) => candidate.id === anomalyId,
              );
              return (
                anomaly && (
                  <li
                    key={anomaly.id}
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
                )
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function CriterionView({
  criterion,
  analytics,
  gradedCount,
}: {
  criterion: Criterion;
  analytics: CriterionAnalytics;
  gradedCount: number;
}) {
  return (
    <li className="min-w-0 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-semibold">
            {criterion.frenchName}
          </h3>
          <p className="text-muted-foreground">{criterion.englishSubtitle}</p>
        </div>
        <p className="shrink-0 text-muted-foreground tabular-nums">
          out of {formatNumber(criterion.maxScore)}
        </p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat term="Lost points">
          {analytics.lostPointsCount} of {pluralizeSubmissions(gradedCount)}
        </Stat>
        <Stat term="Total points lost">
          {formatNumber(analytics.totalPointsLost)}
        </Stat>
        <Stat term="Average points lost">
          {formatNumber(analytics.averagePointsLost)} per submission
        </Stat>
      </dl>

      <ScoreChart criterion={criterion} analytics={analytics} />
      <LevelLegend criterion={criterion} />
      {analytics.mistakeCategories.length > 0 && (
        <section className="mt-5">
          <h4 className="mb-2 font-medium">Mistake categories</h4>
          <MistakeCategoryList counts={analytics.mistakeCategories} />
        </section>
      )}
    </li>
  );
}

function ScoreChart({
  criterion,
  analytics,
}: {
  criterion: Criterion;
  analytics: CriterionAnalytics;
}) {
  const data = analytics.scoreCounts.map(({ score, count }) => ({
    score: formatNumber(score),
    count,
    level: getLevelLabel(criterion, score),
    fill: getLevelBarColor(score, criterion.maxScore),
  }));
  const description = data
    .map(({ score, count }) => `${score}: ${pluralizeSubmissions(count)}`)
    .join(", ");

  return (
    <figure className="mt-5">
      <figcaption className="font-medium">Submissions per score</figcaption>
      <ChartContainer
        config={chartConfig}
        role="img"
        aria-label={`Submissions per score for ${criterion.frenchName}. ${description}.`}
        className="mt-2 aspect-auto h-56 w-full text-sm"
      >
        <BarChart data={data} margin={{ top: 24, right: 8, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="score"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                className="text-sm"
                labelFormatter={(_, payload) => {
                  const item = payload[0]?.payload;
                  return item
                    ? `${item.score}/${formatNumber(criterion.maxScore)}: ${item.level}`
                    : null;
                }}
              />
            }
          />
          <Bar dataKey="count" radius={4} isAnimationActive={false}>
            <LabelList
              dataKey="count"
              position="top"
              className="fill-foreground"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </figure>
  );
}

function LevelLegend({ criterion }: { criterion: Criterion }) {
  const groups: { lowest: number; highest: number; label: string }[] = [];
  for (const level of criterion.levels) {
    const previous = groups.at(-1);
    if (previous?.label === level.label) {
      previous.highest = level.score;
    } else {
      groups.push({
        lowest: level.score,
        highest: level.score,
        label: level.label,
      });
    }
  }

  return (
    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {groups.map((group) => (
        <div key={group.lowest} className="contents">
          <dt className="font-semibold tabular-nums">
            {group.lowest === group.highest
              ? formatNumber(group.lowest)
              : `${formatNumber(group.lowest)} to ${formatNumber(group.highest)}`}
          </dt>
          <dd>{group.label}</dd>
        </div>
      ))}
    </dl>
  );
}
