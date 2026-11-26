"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useId, useState, useSyncExternalStore } from "react";
import {
  AnomalyList,
  CriterionCard,
  CriterionMistakeCategories,
  EmptyAnalytics,
  getPendingMessage,
  MissingCriterionNote,
  pluralizeSubmissions,
  Stat,
} from "@/components/analytics";
import { SectionTitle } from "@/components/page-title";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  type AnalyticsCriterionSummary,
  clampClassAnalyticsSessionCount,
  defaultClassAnalyticsSessionCount,
  maxClassAnalyticsSessionCount,
} from "@/lib/analytics";
import { formatDate, formatPercent } from "@/lib/format";
import {
  readStorageItem,
  subscribeToStorage,
  writeStorageItem,
} from "@/lib/local-storage";
import { analyticsCriteria } from "@/lib/rubrics";
import { roundScore } from "@/lib/scores";

function useSessionCount(classId: Id<"classes">) {
  const storageName = `class-analytics:${classId}`;
  const sessionCount = useSyncExternalStore(
    subscribeToStorage,
    () => {
      const stored = readStorageItem(storageName);
      return stored === null
        ? defaultClassAnalyticsSessionCount
        : clampClassAnalyticsSessionCount(Number(stored));
    },
    () => defaultClassAnalyticsSessionCount,
  );

  function setSessionCount(count: number) {
    writeStorageItem(storageName, String(count));
  }

  return { sessionCount, setSessionCount };
}

function SessionCountInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (count: number) => void;
}) {
  const id = useId();
  const [text, setText] = useState(String(value));
  const [shownValue, setShownValue] = useState(value);

  if (value !== shownValue) {
    setShownValue(value);
    if (Number(text) !== value) {
      setText(String(value));
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id}>Covered sessions (newest)</Label>
      <Input
        id={id}
        type="number"
        min={1}
        max={maxClassAnalyticsSessionCount}
        step={1}
        value={text}
        onChange={(event) => {
          const typed = event.target.value;
          const number = Number(typed);
          if (typed.trim() === "" || !Number.isFinite(number)) {
            setText(typed);
            return;
          }
          const count = clampClassAnalyticsSessionCount(number);
          setText(count === number ? typed : String(count));
          onChange(count);
        }}
        onBlur={() => setText(String(value))}
        className="h-10 w-20 bg-card"
      />
    </div>
  );
}

/**
 * The "Analytics" section of a class, with aggregates of its newest sessions and recent individual submissions, compared through the analytics criteria.
 *
 * @param classId The class ID.
 */
export function ClassAnalytics({ classId }: { classId: Id<"classes"> }) {
  const { sessionCount, setSessionCount } = useSessionCount(classId);
  const analytics = useQuery(api.classes.getAnalytics, {
    classId,
    sessionCount,
  });
  return (
    <section className="mt-12">
      <SectionTitle
        title="Analytics"
        actions={
          <SessionCountInput value={sessionCount} onChange={setSessionCount} />
        }
      />

      {analytics !== undefined && <AnalyticsContent analytics={analytics} />}
    </section>
  );
}

function AnalyticsContent({
  analytics,
}: {
  analytics: FunctionReturnType<typeof api.classes.getAnalytics>;
}) {
  if (
    !analytics ||
    analytics.gradedCount === 0 ||
    analytics.oldestExamDate === null
  ) {
    return (
      <EmptyAnalytics
        message="Analytics will appear here once a session has a graded submission."
        pendingCount={analytics?.pendingCount ?? 0}
      />
    );
  }

  const pendingMessage = getPendingMessage(analytics.pendingCount);

  return (
    <div className="grid gap-6">
      <div className="text-muted-foreground">
        <p>
          Based on {pluralizeSubmissions(analytics.gradedCount)} from the{" "}
          {analytics.sessionCount === 1
            ? "newest session"
            : `${analytics.sessionCount} newest sessions`}{" "}
          with a graded submission, since {formatDate(analytics.oldestExamDate)}
          , and from the individual submissions taken after that date (
          {analytics.individualCount} graded).
        </p>
        <p>
          Exams graded with different rubrics are compared through shared
          criteria, as the percentage of points lost.
        </p>
        {pendingMessage && <p>{pendingMessage}</p>}
      </div>

      <ol className="grid gap-4 lg:grid-cols-2">
        {analytics.criteria.map((criterionAnalytics) => (
          <CriterionView
            key={criterionAnalytics.analyticsCriterionId}
            analytics={criterionAnalytics}
            gradedCount={analytics.gradedCount}
          />
        ))}
      </ol>

      <AnomalyList anomalies={analytics.anomalies} />
    </div>
  );
}

function CriterionView({
  analytics,
  gradedCount,
}: {
  analytics: AnalyticsCriterionSummary;
  gradedCount: number;
}) {
  const criterion = analyticsCriteria.find(
    (candidate) => candidate.id === analytics.analyticsCriterionId,
  );

  if (!criterion) {
    return null;
  }

  return (
    <CriterionCard
      frenchName={criterion.frenchName}
      englishSubtitle={criterion.englishSubtitle}
    >
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Stat term="Lost points">
          {analytics.lostPointsCount} of{" "}
          {pluralizeSubmissions(analytics.examCount)}
        </Stat>
        <Stat term="Average points lost">
          {formatPercent(roundScore(100 - analytics.averagePercentKept))}
        </Stat>
      </dl>
      <MissingCriterionNote
        examCount={analytics.examCount}
        totalCount={gradedCount}
      />
      <CriterionMistakeCategories counts={analytics.mistakeCategories} />
    </CriterionCard>
  );
}
