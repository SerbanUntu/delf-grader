"use client";

import { type ReactNode, useState } from "react";
import { FormError } from "@/components/form-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

/**
 * Shows that a step is running on the server.
 *
 * @param children What is running and how long it usually takes.
 */
export function StepInProgress({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
    >
      <span aria-hidden className="relative flex size-3 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-curry opacity-60" />
        <span className="relative inline-flex size-3 rounded-full bg-curry" />
      </span>
      <p>{children}</p>
    </div>
  );
}

/**
 * Shows the error of a step that failed, with a "Retry" button.
 *
 * @param error The error message.
 * @param onRetry Called when the teacher clicks "Retry". The error is shown if it fails.
 */
export function StepFailed({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => Promise<unknown>;
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string>();

  async function retry() {
    setRetryError(undefined);
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (caught) {
      setRetryError(getErrorMessage(caught));
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Alert variant="destructive" role="alert">
        <AlertTitle className="text-base font-semibold">Failed</AlertTitle>
        <AlertDescription className="text-base">{error}</AlertDescription>
      </Alert>
      <FormError message={retryError} />
      <div>
        <Button disabled={isRetrying} onClick={() => void retry()}>
          {isRetrying ? "Retrying..." : "Retry"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Lists the steps that will be re-run when a change is saved, for a confirmation dialog.
 *
 * @param action What the teacher is saving, such as "Saving the new files".
 * @param steps The labels of the steps that will be re-run.
 */
export function RerunDescription({
  action,
  steps,
}: {
  action: string;
  steps: string[];
}) {
  return (
    <>
      <p>{action} will re-run these steps:</p>
      <ul className="mt-2 list-disc pl-6">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      <p className="mt-2">Their previous results will be replaced.</p>
    </>
  );
}
