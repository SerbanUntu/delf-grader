import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import {
  type StepId,
  type StepStatus,
  stepStatusLabels,
  steps,
} from "@/lib/steps";
import { cn } from "@/lib/utils";

/**
 * The vertical list of the steps of a submission, where each step opens its screen once it has been reached.
 *
 * @param statuses The status of every step.
 * @param reached Whether each step has been reached.
 * @param openStep The step whose screen is shown.
 * @param onOpenStep Called with the step the teacher clicked.
 */
export function StepList({
  statuses,
  reached,
  openStep,
  onOpenStep,
}: {
  statuses: Record<StepId, StepStatus>;
  reached: Record<StepId, boolean>;
  openStep: StepId;
  onOpenStep: (stepId: StepId) => void;
}) {
  return (
    <nav aria-label="Steps">
      <ol className="grid gap-2">
        {steps.map((step, index) => {
          const status = statuses[step.id];
          const isOpen = step.id === openStep;
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!reached[step.id]}
                aria-current={isOpen ? "step" : undefined}
                onClick={() => onOpenStep(step.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "enabled:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                  isOpen &&
                    "border-curry bg-curry-soft enabled:hover:bg-curry-soft",
                )}
              >
                <StepIcon status={status} number={index + 1} />
                <span className="min-w-0">
                  <span className="block font-semibold">{step.label}</span>
                  <span
                    className={cn(
                      "block text-sm text-muted-foreground",
                      status === "failed" && "font-medium text-destructive",
                    )}
                  >
                    {stepStatusLabels[status]}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepIcon({ status, number }: { status: StepStatus; number: number }) {
  const className =
    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-semibold";
  if (status === "done") {
    return (
      <span
        aria-hidden
        className={cn(
          className,
          "border-emerald-700 bg-emerald-700 text-white",
        )}
      >
        <CheckIcon className="size-5" />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        aria-hidden
        className={cn(
          className,
          "border-destructive bg-destructive text-white",
        )}
      >
        <Cross2Icon className="size-4" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        className,
        status === "inProgress"
          ? "border-curry bg-card"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {number}
    </span>
  );
}
