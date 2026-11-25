"use client";

import type { FunctionReturnType } from "convex/server";
import Image from "next/image";
import { SubmissionActions } from "@/components/item-actions";
import { ItemCard } from "@/components/item-card";
import { StudentLabel } from "@/components/student-label";
import { otherBrowserMessage } from "@/components/submission-images";
import { Badge } from "@/components/ui/badge";
import type { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/format";
import { useLocalPages } from "@/lib/local-pages";
import { type SubmissionBadge, submissionBadgeLabels } from "@/lib/steps";
import { cn } from "@/lib/utils";

export type SubmissionCardData = FunctionReturnType<
  typeof api.submissions.listBySession
>[number];

const badgeClassNames: Record<SubmissionBadge, string> = {
  redact: "border-curry bg-curry-soft text-foreground",
  transcribing: "border-border bg-card text-foreground",
  grading: "border-border bg-card text-foreground",
  failed: "border-transparent bg-destructive text-destructive-foreground",
};

/**
 * The card of a submission, with the first page as its cover, the student name, the exam date, the status and the score.
 *
 * @param submission The submission's card data.
 */
export function SubmissionCard({
  submission,
}: {
  submission: SubmissionCardData;
}) {
  return (
    <ItemCard
      href={`/submissions/${submission._id}`}
      title={submission.name}
      cover={
        <div className="relative h-40 overflow-hidden border-b bg-muted/50">
          {submission.coverUrl ? (
            <CoverImage url={submission.coverUrl} />
          ) : (
            <LocalCover
              submissionId={submission._id}
              isUploaded={submission.isUploaded}
            />
          )}
          {submission.badge && (
            <Badge
              variant="outline"
              className={cn(
                "absolute top-3 left-3 text-sm shadow-sm",
                badgeClassNames[submission.badge],
              )}
            >
              {submission.badge !== "failed" &&
                submission.badge !== "redact" && (
                  <span
                    aria-hidden
                    className="mr-2 size-2 animate-pulse rounded-full bg-curry"
                  />
                )}
              {submissionBadgeLabels[submission.badge]}
            </Badge>
          )}
        </div>
      }
      details={
        <>
          <StudentLabel
            studentId={submission.studentId}
            classId={submission.classId}
          />
          <p>{formatDate(submission.examDate)}</p>
        </>
      }
      actions={<SubmissionActions submission={submission} />}
      score={submission.score}
    />
  );
}

function CoverImage({ url }: { url: string }) {
  return (
    <Image
      src={url}
      alt=""
      fill
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      unoptimized
      className="bg-white object-cover object-top"
    />
  );
}

function LocalCover({
  submissionId,
  isUploaded,
}: {
  submissionId: string;
  isUploaded: boolean;
}) {
  const pages = useLocalPages(submissionId);

  if (pages === undefined) {
    return null;
  }
  if (pages) {
    return <CoverImage url={pages[0].url} />;
  }
  return (
    <p className="flex h-full items-center justify-center px-6 text-center text-muted-foreground">
      {isUploaded ? otherBrowserMessage : "Not uploaded yet"}
    </p>
  );
}
