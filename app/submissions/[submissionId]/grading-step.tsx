"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useMutation } from "convex/react";
import { type ReactNode, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormError } from "@/components/form-error";
import { ScoreCircle } from "@/components/score-circle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errors";
import { formatNumber } from "@/lib/format";
import { type GradingResult, getAutomaticZeroReason } from "@/lib/grading";
import {
  type Criterion,
  getLevelLabel,
  getRubric,
  type Rubric,
} from "@/lib/rubrics";
import { StepHeading } from "./step-heading";
import { StepFailed, StepInProgress } from "./step-status";

/**
 * The grading step, which shows the progress of the grading and then its result.
 *
 * @param submissionId The submission ID.
 * @param grading The grading of the submission, or undefined if it has not started.
 * @param wordCount The number of words in the transcription, or null if the transcription is not done.
 */
export function GradingStep({
  submissionId,
  grading,
  wordCount,
}: {
  submissionId: Id<"submissions">;
  grading: Doc<"submissions">["grading"];
  wordCount: number | null;
}) {
  const regrade = useMutation(api.grading.regrade);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string>();

  async function confirmRegrade() {
    setError(undefined);
    try {
      await regrade({ submissionId });
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <StepHeading title="Grading" />
        {grading?.status === "done" && (
          <Button variant="outline" onClick={() => setIsConfirming(true)}>
            Re-grade
          </Button>
        )}
      </div>
      <FormError message={error} />
      {grading?.status === "inProgress" && (
        <StepInProgress>
          Grading the transcription against the rubric. This usually takes a
          minute or two, and you can leave this page in the meantime.
        </StepInProgress>
      )}
      {grading?.status === "failed" && (
        <StepFailed
          error={grading.error}
          onRetry={() => regrade({ submissionId })}
        />
      )}
      {grading?.status === "done" && (
        <GradingResultView result={grading.result} wordCount={wordCount} />
      )}
      {grading === undefined && (
        <p className="text-muted-foreground">
          Grading starts once the transcription is done.
        </p>
      )}

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title="Re-grade this submission?"
        description="Grading runs again on the same transcription and exam question. The current result will be replaced."
        onConfirm={confirmRegrade}
      />
    </section>
  );
}

function GradingResultView({
  result,
  wordCount,
}: {
  result: GradingResult;
  wordCount: number | null;
}) {
  const rubric = getRubric(result.rubricId);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border bg-card p-5">
        <ScoreCircle score={result.totalScore} size="lg" />
        <dl className="grid gap-1">
          <SummaryLine term="Rubric">{rubric.name}</SummaryLine>
          {wordCount !== null && (
            <SummaryLine term="Word count">
              {wordCount} {wordCount === 1 ? "word" : "words"} (at least{" "}
              {rubric.minimumWords} expected)
            </SummaryLine>
          )}
          {result.textType && (
            <SummaryLine term="Expected text type">
              {result.textType}
            </SummaryLine>
          )}
        </dl>
      </div>

      <Warnings rubric={rubric} result={result} wordCount={wordCount} />

      <ol className="grid gap-4">
        {result.criteria.map((criterionResult) => {
          const criterion = rubric.criteria.find(
            (candidate) => candidate.id === criterionResult.criterionId,
          );
          return (
            criterion && (
              <CriterionView
                key={criterion.id}
                criterion={criterion}
                result={criterionResult}
              />
            )
          );
        })}
      </ol>
    </div>
  );
}

function SummaryLine({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="inline text-muted-foreground">{term}: </dt>
      <dd className="inline font-medium">{children}</dd>
    </div>
  );
}

function Warnings({
  rubric,
  result,
  wordCount,
}: {
  rubric: Rubric;
  result: GradingResult;
  wordCount: number | null;
}) {
  const zeroReason =
    wordCount === null ? null : getAutomaticZeroReason(rubric, wordCount);
  const isShort =
    !zeroReason && wordCount !== null && wordCount < rubric.minimumWords;
  const anomalies = rubric.anomalies.filter((anomaly) =>
    result.anomalies.some((anomalyId) => anomalyId === anomaly.id),
  );

  if (!zeroReason && !isShort && anomalies.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {zeroReason && (
        <Warning title="Every criterion is set to 0">{zeroReason}</Warning>
      )}
      {isShort && (
        <Warning title="Shorter than expected">
          The text has {wordCount} {wordCount === 1 ? "word" : "words"}, but the
          rubric asks for at least {rubric.minimumWords}.
        </Warning>
      )}
      {anomalies.map((anomaly) => (
        <Warning
          key={anomaly.id}
          title={`${anomaly.frenchName} (${anomaly.englishSubtitle})`}
        >
          {anomaly.caps.length > 0
            ? "Some criteria are capped because of this. The caps are listed under each criterion."
            : "The rubric asks the teacher to review this paper rather than applying a fixed penalty, so check the grading below."}
        </Warning>
      ))}
    </div>
  );
}

function Warning({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Alert className="border-amber-400 bg-amber-50 text-foreground">
      <ExclamationTriangleIcon aria-hidden className="size-5 text-amber-700" />
      <AlertTitle className="text-base font-semibold leading-snug">
        {title}
      </AlertTitle>
      <AlertDescription className="text-base">{children}</AlertDescription>
    </Alert>
  );
}

function CriterionView({
  criterion,
  result,
}: {
  criterion: Criterion;
  result: GradingResult["criteria"][number];
}) {
  return (
    <li className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-semibold">
            {criterion.frenchName}
          </h3>
          <p className="text-muted-foreground">{criterion.englishSubtitle}</p>
        </div>
        <p className="shrink-0 text-xl font-semibold tabular-nums">
          {formatNumber(result.score)}/{formatNumber(criterion.maxScore)}
        </p>
      </div>
      <p className="mt-3">
        <span className="inline-block rounded-md bg-curry-soft px-2.5 py-0.5 font-medium">
          {getLevelLabel(criterion, result.score)}
        </span>
      </p>
      {result.deductions.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {result.deductions.map((deduction) => (
            <li
              key={`${deduction.points}:${deduction.reason}`}
              className="flex items-start gap-3"
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-muted px-2 py-0.5 font-semibold tabular-nums">
                -{formatNumber(deduction.points)}
              </span>
              <span className="min-w-0 wrap-break-word">
                {deduction.reason}
                {deduction.isAutomatic && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    (automatic)
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-muted-foreground">No points removed.</p>
      )}
    </li>
  );
}
