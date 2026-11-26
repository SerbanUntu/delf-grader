"use client";

import { CheckIcon, CopyIcon, DownloadIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildFeedback,
  formatFeedbackText,
  getFeedbackFileName,
} from "@/lib/feedback";
import type { GradingResult } from "@/lib/grading";
import { useStudentName } from "@/lib/students";

const copiedLabelDuration = 2000;

/**
 * The "Copy feedback" and "Download PDF" buttons, which export the grading for the student.
 *
 * @param result The grading result.
 * @param submissionName The name of the submission.
 * @param studentId The student ID, or undefined when the submission has no student.
 * @param examDate The stored exam date.
 * @param onError Called with a message when the export fails, or with undefined when a new export starts.
 */
export function FeedbackActions({
  result,
  submissionName,
  studentId,
  examDate,
  onError,
}: {
  result: GradingResult;
  submissionName: string;
  studentId: string | undefined;
  examDate: string;
  onError: (message: string | undefined) => void;
}) {
  const studentName = useStudentName(studentId);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const input = { result, submissionName, studentName, examDate };

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = setTimeout(() => setIsCopied(false), copiedLabelDuration);
    return () => clearTimeout(timeout);
  }, [isCopied]);

  async function copyFeedback() {
    onError(undefined);
    try {
      await navigator.clipboard.writeText(
        formatFeedbackText(buildFeedback(input)),
      );
      setIsCopied(true);
    } catch {
      onError("The feedback could not be copied. Please try again.");
    }
  }

  async function downloadPdf() {
    onError(undefined);
    setIsDownloading(true);
    try {
      const { downloadFeedbackPdf } = await import("@/lib/feedback-pdf");
      await downloadFeedbackPdf(
        buildFeedback(input),
        getFeedbackFileName(input),
      );
    } catch {
      onError("The PDF could not be made. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={copyFeedback}>
        {isCopied ? (
          <CheckIcon aria-hidden className="mr-2 size-4" />
        ) : (
          <CopyIcon aria-hidden className="mr-2 size-4" />
        )}
        {isCopied ? "Copied" : "Copy feedback"}
      </Button>
      <Button variant="outline" onClick={downloadPdf} disabled={isDownloading}>
        <DownloadIcon aria-hidden className="mr-2 size-4" />
        {isDownloading ? "Preparing PDF..." : "Download PDF"}
      </Button>
    </>
  );
}
