"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import type { ReactNode } from "react";
import {
  MistakeCategoryList,
  pluralizeSubmissions,
  Stat,
} from "@/components/analytics";
import { CardGrid } from "@/components/card-grid";
import { PageHeader } from "@/components/page-header";
import { MissingItem, PageTitle, SectionTitle } from "@/components/page-title";
import { IdentifyButton } from "@/components/student-label";
import { SubmissionCard } from "@/components/submission-card";
import { api } from "@/convex/_generated/api";
import type { StudentCriterionAnalytics } from "@/lib/analytics";
import { formatPercent } from "@/lib/format";
import { analyticsCriteria } from "@/lib/rubrics";
import {
  getSameStudentIds,
  getStudentLabel,
  useStudentName,
  useStudentNames,
} from "@/lib/students";
import { PercentChart, ScoreChart } from "./student-charts";

type StudentExam = NonNullable<
  FunctionReturnType<typeof api.students.get>
>["exams"][number];

/**
 * The page of a student in a class, with simple statistics over their graded submissions. Student IDs that this browser maps to the same name are shown as one student.
 *
 * @param classId The class ID read from the URL.
 * @param studentId The student ID read from the URL.
 */
export function StudentView({
  classId,
  studentId,
}: {
  classId: string;
  studentId: string;
}) {
  const names = useStudentNames();
  const name = useStudentName(studentId);
  const data = useQuery(api.students.get, {
    classId,
    studentIds: getSameStudentIds(names, classId, studentId),
  });

  if (data === null) {
    return (
      <>
        <PageHeader breadcrumbs={[{ label: "Classes", href: "/" }]} />
        <main className="container">
          <MissingItem itemType="student" />
        </main>
      </>
    );
  }

  if (data === undefined) {
    return <PageHeader breadcrumbs={[{ label: "Classes", href: "/" }]} />;
  }

  const { schoolClass, exams, cards, criteria, mistakeCategories } = data;
  const label = getStudentLabel(names, studentId);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Classes", href: "/" },
          { label: schoolClass.name, href: `/classes/${schoolClass._id}` },
          { label },
        ]}
      />
      <main className="container animate-in fade-in py-8 duration-300">
        <PageTitle title={label}>
          {!name && (
            <div className="my-2">
              <IdentifyButton studentId={studentId} classId={schoolClass._id} />
            </div>
          )}
          <p>
            {pluralizeSubmissions(exams.length)} graded in {schoolClass.name}
          </p>
        </PageTitle>

        {exams.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
            Statistics will appear here once a submission of this student is
            graded.
          </p>
        ) : (
          <>
            <StudentSection title="Score over time">
              <div className="rounded-xl border bg-card p-5">
                <ScoreChart exams={exams} />
              </div>
            </StudentSection>

            <StudentSection
              title="Criteria"
              description="Exams graded with different rubrics are compared through these shared criteria, as the percentage of points kept."
            >
              <ol className="grid gap-4 lg:grid-cols-2">
                {criteria.map((criterionAnalytics) => (
                  <CriterionView
                    key={criterionAnalytics.analyticsCriterionId}
                    analytics={criterionAnalytics}
                    exams={exams}
                  />
                ))}
              </ol>
            </StudentSection>

            <StudentSection
              title="Most frequent mistakes"
              description="The mistake categories of the points removed by the grader, over all graded submissions."
            >
              <div className="rounded-xl border bg-card p-5">
                {mistakeCategories.length > 0 ? (
                  <MistakeCategoryList counts={mistakeCategories} />
                ) : (
                  <p className="text-muted-foreground">
                    No mistake categories were found.
                  </p>
                )}
              </div>
            </StudentSection>

            <StudentSection title="Submissions">
              <CardGrid
                items={cards}
                storageName="cards:student-submissions"
                getName={(submission) => submission.name}
                emptyMessage="No graded submissions yet."
                renderItem={(submission) => (
                  <SubmissionCard
                    key={submission._id}
                    submission={submission}
                    showRubric
                  />
                )}
              />
            </StudentSection>
          </>
        )}
      </main>
    </>
  );
}

function StudentSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12">
      <SectionTitle title={title} />
      {description && (
        <p className="-mt-2 mb-4 text-muted-foreground">{description}</p>
      )}
      {children}
    </section>
  );
}

function CriterionView({
  analytics,
  exams,
}: {
  analytics: StudentCriterionAnalytics;
  exams: StudentExam[];
}) {
  const criterion = analyticsCriteria.find(
    (candidate) => candidate.id === analytics.analyticsCriterionId,
  );
  const points = exams.flatMap((exam) => {
    const percent = exam.percentsKept[analytics.analyticsCriterionId];
    return percent === undefined ? [] : [{ examDate: exam.examDate, percent }];
  });
  const newest = points.at(-1);

  if (!criterion || !newest) {
    return null;
  }

  return (
    <li className="min-w-0 rounded-xl border bg-card p-5">
      <h3 className="text-lg leading-snug font-semibold">
        {criterion.frenchName}
      </h3>
      <p className="text-muted-foreground">{criterion.englishSubtitle}</p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Stat term="Average points kept">
          {formatPercent(analytics.averagePercentKept)}
        </Stat>
        <Stat term="Newest exam">{formatPercent(newest.percent)}</Stat>
      </dl>
      {analytics.examCount < exams.length && (
        <p className="mt-3 text-sm text-muted-foreground">
          Based on {analytics.examCount} of {exams.length} submissions. The
          rubric of the others has no criterion for it.
        </p>
      )}

      <PercentChart points={points} criterionName={criterion.frenchName} />
    </li>
  );
}
