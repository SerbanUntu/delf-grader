import { v } from "convex/values";
import { computeStudentAnalytics, getPercentsKept } from "../lib/analytics";
import type { GradingResult } from "../lib/grading";
import { isHash } from "../lib/student-ids";
import type { Doc, Id } from "./_generated/dataModel";
import { type QueryCtx, query } from "./_generated/server";
import { findOwned } from "./access";
import { getSessionStats, pickExam, toSubmissionCard } from "./model";
import { type Exam, listLimit } from "./validation";

const maxStudentIdCount = 50;

type GradedSubmission = {
  submission: Doc<"submissions">;
  session: Doc<"sessions"> | null;
  exam: Exam;
  result: GradingResult;
};

async function toGradedSubmissions(
  ctx: QueryCtx,
  submissions: Doc<"submissions">[],
): Promise<GradedSubmission[]> {
  const sessions = new Map<Id<"sessions">, Doc<"sessions"> | null>();
  const graded: GradedSubmission[] = [];
  for (const submission of submissions) {
    const grading = submission.grading;
    if (grading?.status !== "done") {
      continue;
    }
    if (submission.kind === "individual") {
      graded.push({
        submission,
        session: null,
        exam: pickExam(submission),
        result: grading.result,
      });
      continue;
    }
    if (!sessions.has(submission.sessionId)) {
      sessions.set(
        submission.sessionId,
        await ctx.db.get("sessions", submission.sessionId),
      );
    }
    const session = sessions.get(submission.sessionId);
    if (session) {
      graded.push({
        submission,
        session,
        exam: pickExam(session),
        result: grading.result,
      });
    }
  }
  return graded.toSorted(
    (first, second) =>
      first.exam.examDate.localeCompare(second.exam.examDate) ||
      first.submission._creationTime - second.submission._creationTime,
  );
}

export const listByClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const schoolClass = await findOwned(ctx, "classes", args.classId);
    if (!schoolClass) {
      return [];
    }
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_classId_and_studentId", (q) =>
        q.eq("classId", schoolClass._id).gt("studentId", ""),
      )
      .take(listLimit);
    const students = new Map<
      string,
      {
        studentId: string;
        gradedCount: number;
        examDate: string;
        _creationTime: number;
        score: number;
      }
    >();
    for (const { submission, exam, result } of await toGradedSubmissions(
      ctx,
      submissions,
    )) {
      const studentId = submission.studentId;
      if (!studentId) {
        continue;
      }
      students.set(studentId, {
        studentId,
        gradedCount: (students.get(studentId)?.gradedCount ?? 0) + 1,
        examDate: exam.examDate,
        _creationTime: submission._creationTime,
        score: result.totalScore,
      });
    }
    return Array.from(students.values());
  },
});

export const get = query({
  args: { classId: v.string(), studentIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const schoolClass = await findOwned(ctx, "classes", args.classId);
    if (
      !schoolClass ||
      args.studentIds.length > maxStudentIdCount ||
      !args.studentIds.every(isHash)
    ) {
      return null;
    }
    const submissions: Doc<"submissions">[] = [];
    for (const studentId of new Set(args.studentIds)) {
      submissions.push(
        ...(await ctx.db
          .query("submissions")
          .withIndex("by_classId_and_studentId", (q) =>
            q.eq("classId", schoolClass._id).eq("studentId", studentId),
          )
          .take(listLimit)),
      );
    }
    const graded = await toGradedSubmissions(ctx, submissions);
    const sessionMedians = new Map<Id<"sessions">, number | null>();
    const exams = [];
    const cards = [];
    for (const { submission, session, exam, result } of graded) {
      if (session && !sessionMedians.has(session._id)) {
        sessionMedians.set(
          session._id,
          (await getSessionStats(ctx, session._id)).score,
        );
      }
      exams.push({
        submissionId: submission._id,
        examDate: exam.examDate,
        score: result.totalScore,
        sessionMedian: session
          ? (sessionMedians.get(session._id) ?? null)
          : null,
        percentsKept: getPercentsKept(result),
      });
      cards.push(await toSubmissionCard(ctx, submission, exam));
    }
    return {
      schoolClass,
      exams,
      cards,
      ...computeStudentAnalytics(graded.map(({ result }) => result)),
    };
  },
});
