"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { ExamDetails } from "@/components/exam-details";
import { SubmissionActions } from "@/components/item-actions";
import { type BreadcrumbEntry, PageHeader } from "@/components/page-header";
import { MissingItem, PageTitle } from "@/components/page-title";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/format";

/**
 * The page of a submission.
 *
 * @param submissionId The submission ID read from the URL.
 */
export function SubmissionView({ submissionId }: { submissionId: string }) {
  const data = useQuery(api.submissions.get, { submissionId });
  const updateExam = useMutation(api.submissions.updateExam);

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

  const { submission, schoolClass, session, exam } = data;
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

        <div className="mt-6">
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
