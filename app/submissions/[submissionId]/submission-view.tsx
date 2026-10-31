"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { ExamDetails } from "@/components/exam-details";
import { SubmissionActions } from "@/components/item-actions";
import { type BreadcrumbEntry, PageHeader } from "@/components/page-header";
import { MissingItem, PageTitle } from "@/components/page-title";
import { SideBySide, SubmissionImages } from "@/components/submission-images";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/format";
import { useLocalPages } from "@/lib/local-pages";
import { getRubric } from "@/lib/rubrics";
import {
  getCurrentStep,
  getReachedSteps,
  getStepStatuses,
  getStepsToRerun,
  type StepId,
} from "@/lib/steps";
import { GradingStep } from "./grading-step";
import { RedactionStep } from "./redaction-step";
import { StepList } from "./step-list";
import { TranscriptionStep } from "./transcription-step";
import { UploadStep } from "./upload-step";

/**
 * The page of a submission.
 *
 * @param submissionId The submission ID read from the URL.
 */
export function SubmissionView({ submissionId }: { submissionId: string }) {
  const data = useQuery(api.submissions.get, { submissionId });
  const updateExam = useMutation(api.submissions.updateExam);
  const localPages = useLocalPages(submissionId);
  const [chosenStep, setChosenStep] = useState<StepId>();

  if (data === null) {
    return (
      <>
        <PageHeader breadcrumbs={[{ label: "Classes", href: "/" }]} />
        <main className="container">
          <MissingItem itemType="submission" />
        </main>
      </>
    );
  }

  if (data === undefined) {
    return <PageHeader breadcrumbs={[{ label: "Classes", href: "/" }]} />;
  }

  const { submission, schoolClass, session, exam, pages } = data;
  const statuses = getStepStatuses(submission);
  const reached = getReachedSteps(statuses);
  const openStep =
    chosenStep && reached[chosenStep] ? chosenStep : getCurrentStep(statuses);
  const isUploaded = submission.uploadedAt !== undefined;
  const images = (
    <SubmissionImages
      savedPages={pages}
      localPages={localPages}
      isUploaded={isUploaded}
    />
  );
  const classHref = `/classes/${schoolClass._id}`;
  const sessionHref = session ? `/sessions/${session._id}` : undefined;
  const breadcrumbs: BreadcrumbEntry[] = [
    { label: "Classes", href: "/" },
    { label: schoolClass.name, href: classHref },
    ...(session ? [{ label: session.displayName, href: sessionHref }] : []),
    { label: submission.name },
  ];

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <main className="container animate-in fade-in py-8 duration-300">
        <PageTitle
          title={submission.name}
          actions={
            <SubmissionActions
              submission={submission}
              redirectTo={sessionHref ?? classHref}
            />
          }
        >
          {formatDate(exam.examDate)}
        </PageTitle>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24">
            <StepList
              statuses={statuses}
              reached={reached}
              openStep={openStep}
              onOpenStep={setChosenStep}
            />
          </aside>
          <div className="min-w-0">
            {openStep === "upload" && (
              <UploadStep
                submissionId={submission._id}
                isUploaded={isUploaded}
                isRedacted={submission.pageIds !== undefined}
                localPages={localPages}
                stepsToRerun={getStepsToRerun(statuses, "upload")}
                onSaved={() => setChosenStep("redaction")}
              />
            )}
            {openStep === "redaction" && (
              <RedactionStep
                submissionId={submission._id}
                savedPages={pages}
                localPages={localPages}
                onSaved={() => setChosenStep("transcription")}
              />
            )}
            {openStep === "transcription" && (
              <SideBySide images={images}>
                <TranscriptionStep
                  submissionId={submission._id}
                  transcription={submission.transcription}
                  minimumWords={getRubric(exam.rubricId).minimumWords}
                  stepsToRerun={getStepsToRerun(statuses, "transcription")}
                />
              </SideBySide>
            )}
            {openStep === "grading" && (
              <SideBySide images={images}>
                <GradingStep
                  submissionId={submission._id}
                  grading={submission.grading}
                  wordCount={
                    submission.transcription?.status === "done"
                      ? submission.transcription.wordCount
                      : null
                  }
                />
              </SideBySide>
            )}
          </div>
        </div>

        <div className="mt-12">
          {sessionHref ? (
            <ExamDetails
              exam={exam}
              note={
                <>
                  Every submission in this session shares this exam. It can be
                  changed from the{" "}
                  <Link
                    href={sessionHref}
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    session page
                  </Link>
                  .
                </>
              }
            />
          ) : (
            <ExamDetails
              exam={exam}
              onSave={(values) =>
                updateExam({
                  submissionId: submission._id,
                  examDate: values.examDate,
                  rubricId: values.rubricId,
                  question: values.question,
                })
              }
            />
          )}
        </div>
      </main>
    </>
  );
}
