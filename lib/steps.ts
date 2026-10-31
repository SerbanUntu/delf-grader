import type { Doc } from "../convex/_generated/dataModel";

export const steps = [
  { id: "upload", label: "Upload" },
  { id: "redaction", label: "Redaction" },
  { id: "transcription", label: "Transcription" },
  { id: "grading", label: "Grading" },
] as const;

export type StepId = (typeof steps)[number]["id"];

export type StepStatus = "notStarted" | "inProgress" | "done" | "failed";

export const stepStatusLabels: Record<StepStatus, string> = {
  notStarted: "Not started",
  inProgress: "In progress",
  done: "Done",
  failed: "Failed",
};

/**
 * Works out the status of each step of a submission.
 *
 * @param submission The submission.
 * @returns The status of every step.
 */
export function getStepStatuses(
  submission: Doc<"submissions">,
): Record<StepId, StepStatus> {
  const isUploaded = submission.uploadedAt !== undefined;
  const isRedacted = submission.pageIds !== undefined;
  return {
    upload: isUploaded ? "done" : "notStarted",
    redaction: isRedacted ? "done" : isUploaded ? "inProgress" : "notStarted",
    transcription: "notStarted",
    grading: "notStarted",
  };
}

/**
 * Checks which steps can be opened, which are the first step and every step whose previous step is done.
 *
 * @param statuses The status of every step.
 * @returns Whether each step has been reached.
 */
export function getReachedSteps(
  statuses: Record<StepId, StepStatus>,
): Record<StepId, boolean> {
  return {
    upload: true,
    redaction: statuses.upload === "done",
    transcription: statuses.redaction === "done",
    grading: statuses.transcription === "done",
  };
}

/**
 * Lists the steps after a given step that have started, which are re-run when that step changes.
 *
 * @param statuses The status of every step.
 * @param stepId The step that changes.
 * @returns The labels of the steps that will be re-run, in order.
 */
export function getStepsToRerun(
  statuses: Record<StepId, StepStatus>,
  stepId: StepId,
): string[] {
  const index = steps.findIndex((step) => step.id === stepId);
  return steps
    .slice(index + 1)
    .filter((step) => statuses[step.id] !== "notStarted")
    .map((step) => step.label);
}

/**
 * Finds the step the teacher most likely wants to see, which is the last step that has been reached.
 *
 * @param statuses The status of every step.
 * @returns The ID of the step.
 */
export function getCurrentStep(statuses: Record<StepId, StepStatus>): StepId {
  const reached = getReachedSteps(statuses);
  return steps.findLast((step) => reached[step.id])?.id ?? "upload";
}
