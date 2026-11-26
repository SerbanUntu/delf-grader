"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CardGrid } from "@/components/card-grid";
import { ExamDialog } from "@/components/exam-form";
import { ClassActions, SessionActions } from "@/components/item-actions";
import { ItemCard } from "@/components/item-card";
import { PageHeader } from "@/components/page-header";
import { MissingItem, PageTitle, SectionTitle } from "@/components/page-title";
import { ScoreChange } from "@/components/score-change";
import { StudentCard } from "@/components/student-card";
import { SubmissionCard } from "@/components/submission-card";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import {
  defaultSessionName,
  defaultSubmissionName,
  formatDate,
  noStudentNamesHint,
} from "@/lib/format";
import {
  getStudentLabel,
  mergeSameStudents,
  useStudentKeys,
  useStudentNames,
} from "@/lib/students";
import { ClassAnalytics } from "./class-analytics";

/**
 * The page of a class, with its sessions, its individual submissions, its students and its analytics.
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
  const students = useQuery(
    api.students.listByClass,
    schoolClass ? { classId: schoolClass._id } : "skip",
  );
  const createSession = useMutation(api.sessions.create);
  const createSubmission = useMutation(api.submissions.createIndividual);
  const { toStudentId } = useStudentKeys();
  const studentNames = useStudentNames();
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
              storageName="cards:sessions"
              getName={(session) => session.displayName}
              emptyMessage="No sessions yet."
              renderItem={(session) => (
                <ItemCard
                  key={session._id}
                  href={`/sessions/${session._id}`}
                  title={session.displayName}
                  details={
                    <>
                      <p>{formatDate(session.examDate)}</p>
                      <p>
                        {session.submissionCount}{" "}
                        {session.submissionCount === 1
                          ? "submission"
                          : "submissions"}
                      </p>
                    </>
                  }
                  score={session.score}
                  scoreExtra={
                    session.scoreChange !== null && (
                      <ScoreChange change={session.scoreChange} />
                    )
                  }
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
              storageName="cards:individual-submissions"
              getName={(submission) =>
                getStudentLabel(studentNames, submission.studentId)
              }
              nameSortLabel="Student name A to Z"
              emptyMessage="No individual submissions yet."
              renderItem={(submission) => (
                <SubmissionCard key={submission._id} submission={submission} />
              )}
            />
          </section>

          <section className="mt-12">
            <SectionTitle title="Students" />
            <CardGrid
              items={
                students &&
                mergeSameStudents(students, studentNames, schoolClass._id)
              }
              storageName="cards:students"
              getName={(student) =>
                getStudentLabel(studentNames, student.studentId)
              }
              nameSortLabel="Student name A to Z"
              emptyMessage="Students appear here once a submission with a student name is graded."
              renderItem={(student) => (
                <StudentCard
                  key={student._id}
                  student={student}
                  classId={schoolClass._id}
                />
              )}
            />
          </section>

          <ClassAnalytics classId={schoolClass._id} />

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
              hint: noStudentNamesHint,
            }}
            studentClassId={schoolClass._id}
            onCreate={async ({ studentName = "", ...values }) => {
              const submissionId = await createSubmission({
                classId: schoolClass._id,
                studentId: await toStudentId(schoolClass._id, studentName),
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
