"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CardGrid } from "@/components/card-grid";
import { ExamDetails } from "@/components/exam-details";
import { SessionActions, SubmissionActions } from "@/components/item-actions";
import { ItemCard } from "@/components/item-card";
import { NameDialog } from "@/components/name-dialog";
import { PageHeader } from "@/components/page-header";
import { MissingItem, PageTitle, SectionTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import {
  defaultSessionName,
  defaultSubmissionName,
  formatDate,
  submissionNameHint,
} from "@/lib/format";
import { isGradingInputChanged } from "@/lib/grading";

/**
 * The page of a session, with its exam, its submissions and its analytics.
 *
 * @param sessionId The session ID read from the URL.
 */
export function SessionView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const data = useQuery(api.sessions.get, { sessionId });
  const submissions = useQuery(
    api.submissions.listBySession,
    data ? { sessionId: data.session._id } : "skip",
  );
  const updateSession = useMutation(api.sessions.update);
  const createSubmission = useMutation(api.submissions.createInSession);
  const [isCreatingSubmission, setIsCreatingSubmission] = useState(false);

  if (data === null) {
    return (
      <>
        <PageHeader breadcrumbs={[{ label: "Classes", href: "/" }]} />
        <main className="container">
          <MissingItem itemType="session" />
        </main>
      </>
    );
  }

  if (data === undefined) {
    return <PageHeader breadcrumbs={[{ label: "Classes", href: "/" }]} />;
  }

  const { session, schoolClass } = data;
  const classHref = `/classes/${schoolClass._id}`;
  const hasGradedSubmission =
    submissions?.some((submission) => submission.grading !== undefined) ?? true;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Classes", href: "/" },
          { label: schoolClass.name, href: classHref },
          { label: session.displayName },
        ]}
      />
      <main className="container animate-in fade-in py-8 duration-300">
        <PageTitle
          title={session.displayName}
          actions={
            <SessionActions
              session={session}
              schoolClassName={schoolClass.name}
              redirectTo={classHref}
            />
          }
        />

        <div className="mt-6">
          <ExamDetails
            exam={session}
            initialName={session.name ?? ""}
            nameField={{
              label: "Name (optional)",
              placeholder: (examDate) =>
                defaultSessionName(schoolClass.name, examDate),
            }}
            onSave={(values) =>
              updateSession({ sessionId: session._id, ...values })
            }
            getSaveWarning={(values) =>
              hasGradedSubmission && isGradingInputChanged(session, values)
                ? "Changing the rubric or the exam question will re-grade all graded submissions in this session. Their previous results will be replaced."
                : null
            }
          />
        </div>

        <Tabs defaultValue="submissions" className="mt-8">
          <TabsList>
            <TabsTrigger value="submissions" className="text-base">
              Submissions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-base">
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="submissions" className="mt-6">
            <SectionTitle
              title="Submissions"
              actions={
                <Button onClick={() => setIsCreatingSubmission(true)}>
                  <PlusIcon aria-hidden className="mr-2 size-4" />
                  Add submission
                </Button>
              }
            />
            <CardGrid
              items={submissions}
              emptyMessage="No submissions yet."
              renderItem={(submission) => (
                <ItemCard
                  key={submission._id}
                  href={`/submissions/${submission._id}`}
                  title={submission.name}
                  details={formatDate(session.examDate)}
                  actions={<SubmissionActions submission={submission} />}
                />
              )}
            />
          </TabsContent>
          <TabsContent value="analytics" className="mt-6">
            <p className="rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
              Common mistakes will appear here once submissions are graded.
            </p>
          </TabsContent>
        </Tabs>

        <NameDialog
          open={isCreatingSubmission}
          onOpenChange={setIsCreatingSubmission}
          title="Add submission"
          label="Submission name"
          initialName={defaultSubmissionName}
          placeholder={defaultSubmissionName}
          hint={submissionNameHint}
          submitLabel="Create"
          onSave={async (name) => {
            const submissionId = await createSubmission({
              sessionId: session._id,
              name,
            });
            router.push(`/submissions/${submissionId}`);
          }}
        />
      </main>
    </>
  );
}
