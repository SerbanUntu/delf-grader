"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { maxTotalScore } from "@/lib/scores";

const scoreChartConfig = {
  score: { label: "Score", color: "hsl(var(--foreground))" },
  sessionMedian: {
    label: "Session median",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

const percentChartConfig = {
  percent: { label: "Points kept", color: "hsl(var(--foreground))" },
} satisfies ChartConfig;

function ValueTooltip({
  config,
  formatValue,
}: {
  config: ChartConfig;
  formatValue: (value: number) => string;
}) {
  return (
    <ChartTooltip
      cursor={false}
      content={
        <ChartTooltipContent
          className="text-sm"
          formatter={(value, name, item) => (
            <div className="flex w-full items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="flex-1 text-muted-foreground">
                {config[String(name)]?.label ?? name}
              </span>
              <span className="font-medium text-foreground tabular-nums">
                {formatValue(Number(value))}
              </span>
            </div>
          )}
        />
      }
    />
  );
}

/**
 * A line chart of a student's total score in each exam, by exam date, with the median of the session next to it for exams taken in a session.
 *
 * @param exams The student's graded exams, oldest first.
 */
export function ScoreChart({
  exams,
}: {
  exams: { examDate: string; score: number; sessionMedian: number | null }[];
}) {
  const data = exams.map((exam) => ({
    date: formatDate(exam.examDate),
    score: exam.score,
    sessionMedian: exam.sessionMedian,
  }));
  const hasSessionMedian = data.some(
    ({ sessionMedian }) => sessionMedian !== null,
  );
  const description = data
    .map(
      ({ date, score, sessionMedian }) =>
        `${date}: ${formatNumber(score)}${sessionMedian === null ? "" : ` (session median ${formatNumber(sessionMedian)})`}`,
    )
    .join(", ");

  return (
    <ChartContainer
      config={scoreChartConfig}
      role="img"
      aria-label={`Total score out of ${maxTotalScore} over time. ${description}.`}
      className="aspect-auto h-72 w-full text-sm"
    >
      <LineChart data={data} margin={{ top: 16, right: 16, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          domain={[0, maxTotalScore]}
          ticks={[0, 5, 10, 15, 20, 25]}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <ValueTooltip
          config={scoreChartConfig}
          formatValue={(value) => `${formatNumber(value)}/${maxTotalScore}`}
        />
        {hasSessionMedian && (
          <ChartLegend content={<ChartLegendContent className="text-sm" />} />
        )}
        {hasSessionMedian && (
          <Line
            dataKey="sessionMedian"
            stroke="var(--color-sessionMedian)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: "var(--color-sessionMedian)" }}
            connectNulls
            isAnimationActive={false}
          />
        )}
        <Line
          dataKey="score"
          stroke="var(--color-score)"
          strokeWidth={2}
          dot={{ r: 4, fill: "var(--color-score)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

/**
 * A line chart of the percentage of points a student kept in one analytics criterion, by exam date.
 *
 * @param points The percentage kept in each exam that has the criterion, oldest first.
 * @param criterionName The name of the analytics criterion, read by screen readers.
 */
export function PercentChart({
  points,
  criterionName,
}: {
  points: { examDate: string; percent: number }[];
  criterionName: string;
}) {
  const data = points.map((point) => ({
    date: formatDate(point.examDate),
    percent: point.percent,
  }));
  const description = data
    .map(({ date, percent }) => `${date}: ${formatPercent(percent)}`)
    .join(", ");

  return (
    <ChartContainer
      config={percentChartConfig}
      role="img"
      aria-label={`Points kept in ${criterionName} over time. ${description}.`}
      className="mt-4 aspect-auto h-48 w-full text-sm"
    >
      <LineChart data={data} margin={{ top: 16, right: 16, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(value: number) => formatPercent(value)}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <ValueTooltip config={percentChartConfig} formatValue={formatPercent} />
        <Line
          dataKey="percent"
          stroke="var(--color-percent)"
          strokeWidth={2}
          dot={{ r: 4, fill: "var(--color-percent)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
