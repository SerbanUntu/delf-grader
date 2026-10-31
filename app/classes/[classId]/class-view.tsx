"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CardGrid } from "@/components/card-grid";
import { ExamDialog } from "@/components/exam-form";
import {
  ClassActions,
  SessionActions,
  SubmissionActions,
} from "@/components/item-actions";
import { ItemCard } from "@/components/item-card";
import { PageHeader } from "@/components/page-header";
import { MissingItem, PageTitle, SectionTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import {
  defaultSessionName,
  defaultSubmissionName,
  formatDate,
  submissionNameHint,
} from "@/lib/format";

/**
 * The page of a class, with its sessions and its individual submissions.
 *
 * @param classId The class ID read from the URL.
 */
export function ClassView({ classId }: { classId: string }) {
  const router = useRouter();
  const schoolClass = useQuery(api.classes.get, { classId });
  const sessions = useQuery(
    api.sessions.listByClass,
    schoolClass ? { classId: schoolClass._id } : "skip",
  );
  const submissions = useQuery(
    api.submissions.listIndividual,
    schoolClass ? { classId: schoolClass._id } : "skip",
  );
  const createSession = useMutation(api.sessions.create);
  const createSubmission = useMutation(api.submissions.createIndividual);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isCreatingSubmission, setIsCreatingSubmission] = useState(false);

  if (schoolClass === null) {
    return (
      <>
        <PageHeader breadcrumbs={[{ label: "Classes", href: "/" }]} />
        <main className="container">
          <MissingItem itemType="class" />
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Classes", href: "/" },
          ...(schoolClass ? [{ label: schoolClass.name }] : []),
        ]}
      />
      {schoolClass && (
        <main className="container animate-in fade-in py-8 duration-300">
          <PageTitle
            title={schoolClass.name}
            actions={<ClassActions schoolClass={schoolClass} redirectTo="/" />}
          />

          <section className="mt-10">
            <SectionTitle
              title="Sessions"
              actions={
                <Button onClick={() => setIsCreatingSession(true)}>
                  <PlusIcon aria-hidden className="mr-2 size-4" />
                  New session
                </Button>
              }
            />
            <CardGrid
              items={sessions}
              emptyMessage="No sessions yet."
              renderItem={(session) => (
                <ItemCard
                  key={session._id}
                  href={`/sessions/${session._id}`}
                  title={session.displayName}
                  details={formatDate(session.examDate)}
                  actions={
                    <SessionActions
                      session={session}
                      schoolClassName={schoolClass.name}
                    />
                  }
                />
              )}
            />
          </section>

          <section className="mt-12">
            <SectionTitle
              title="Individual submissions"
              actions={
                <Button onClick={() => setIsCreatingSubmission(true)}>
                  <PlusIcon aria-hidden className="mr-2 size-4" />
                  New submission
                </Button>
              }
            />
            <CardGrid
              items={submissions}
              emptyMessage="No individual submissions yet."
              renderItem={(submission) => (
                <ItemCard
                  key={submission._id}
                  href={`/submissions/${submission._id}`}
                  title={submission.name}
                  details={formatDate(submission.examDate)}
                  actions={<SubmissionActions submission={submission} />}
                />
              )}
            />
          </section>

          <ExamDialog
            open={isCreatingSession}
            onOpenChange={setIsCreatingSession}
            title="New session"
            initialName=""
            nameField={{
              label: "Name (optional)",
              placeholder: (examDate) =>
                defaultSessionName(schoolClass.name, examDate),
            }}
            onCreate={async (values) => {
              const sessionId = await createSession({
                classId: schoolClass._id,
                ...values,
              });
              router.push(`/sessions/${sessionId}`);
            }}
          />
          <ExamDialog
            open={isCreatingSubmission}
            onOpenChange={setIsCreatingSubmission}
            title="New individual submission"
            initialName={defaultSubmissionName}
            nameField={{
              label: "Submission name",
              placeholder: () => defaultSubmissionName,
              hint: submissionNameHint,
            }}
            onCreate={async (values) => {
              const submissionId = await createSubmission({
                classId: schoolClass._id,
                ...values,
              });
              router.push(`/submissions/${submissionId}`);
            }}
          />
        </main>
      )}
    </>
  );
}
