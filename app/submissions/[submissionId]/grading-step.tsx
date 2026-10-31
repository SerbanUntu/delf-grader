import type { Doc } from "@/convex/_generated/dataModel";
import { formatNumber } from "@/lib/format";
import { getRubric } from "@/lib/rubrics";
import { StepHeading } from "./step-heading";
import { StepFailed, StepInProgress } from "./step-status";

/**
 * The grading step, which shows the progress and the score of the grading.
 *
 * @param grading The grading of the submission, or undefined if it has not started.
 */
export function GradingStep({
  grading,
}: {
  grading: Doc<"submissions">["grading"];
}) {
  return (
    <section className="grid gap-5">
      <StepHeading title="Grading" />
      {grading?.status === "inProgress" && (
        <StepInProgress>
          Grading the transcription against the rubric. This usually takes a
          minute or two, and you can leave this page in the meantime.
        </StepInProgress>
      )}
      {grading?.status === "failed" && <StepFailed error={grading.error} />}
      {grading?.status === "done" && (
        <p className="text-2xl font-semibold">
          Total score: {formatNumber(grading.result.totalScore)}/
          {formatNumber(
            getRubric(grading.result.rubricId).criteria.reduce(
              (sum, criterion) => sum + criterion.maxScore,
              0,
            ),
          )}
        </p>
      )}
      {grading === undefined && (
        <p className="text-muted-foreground">
          Grading starts once the transcription is done.
        </p>
      )}
    </section>
  );
}
