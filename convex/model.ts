import { defaultSessionName } from "../lib/format";
import type { GradingResult } from "../lib/grading";
import type { FeedbackLanguage } from "../lib/languages";
import type { RubricId } from "../lib/rubrics";
import { getMedian, roundScore } from "../lib/scores";
import { getStepStatuses, getSubmissionBadge } from "../lib/steps";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { type Exam, listLimit } from "./validation";

/**
 * Adds the name shown for a session, which is the default name when the teacher left it empty.
 *
 * @param session The session.
 * @param className The name of the session's class.
 * @returns The session with its `displayName`.
 */
export function withDisplayName(session: Doc<"sessions">, className: string) {
  return {
    ...session,
    displayName:
      session.name ?? defaultSessionName(className, session.examDate),
  };
}

/**
 * Reads the total score of a submission.
 *
 * @param submission The submission.
 * @returns The total score, or null if the submission is not graded.
 */
export function getScore(submission: Doc<"submissions">): number | null {
  return submission.grading?.status === "done"
    ? submission.grading.result.totalScore
    : null;
}

/**
 * Collects the grading results counted in analytics, leaving out submissions still graded with an earlier rubric of their exam.
 *
 * @param exams The submissions of each exam, with the rubric the exam uses now.
 * @returns The grading results counted, and how many submissions are being graded or re-graded.
 */
export function collectAnalyticsResults(
  exams: { submissions: Doc<"submissions">[]; rubricId: RubricId }[],
) {
  const results: GradingResult[] = [];
  let pendingCount = 0;
  for (const { submissions, rubricId } of exams) {
    for (const { grading } of submissions) {
      if (grading?.status === "done" && grading.result.rubricId === rubricId) {
        results.push(grading.result);
      } else if (
        grading?.status === "inProgress" ||
        grading?.status === "done"
      ) {
        pendingCount++;
      }
    }
  }
  return { results, pendingCount };
}

/**
 * Computes the statistics shown on a session card.
 *
 * @param ctx The function context.
 * @param sessionId The session ID.
 * @returns The number of submissions and the median score of the graded ones, or null if none is graded.
 */
export async function getSessionStats(
  ctx: QueryCtx,
  sessionId: Id<"sessions">,
) {
  const submissions = await ctx.db
    .query("submissions")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .take(listLimit);
  const scores = submissions.map(getScore).filter((score) => score !== null);
  return { submissionCount: submissions.length, score: getMedian(scores) };
}

/**
 * Adds the statistics shown on session cards to the sessions of a class, including the change from the previous session with a score.
 *
 * @param ctx The function context.
 * @param sessions The sessions, newest first.
 * @param className The name of the sessions' class.
 * @returns The sessions with their display name, statistics and change, newest first.
 */
export async function withSessionStats(
  ctx: QueryCtx,
  sessions: Doc<"sessions">[],
  className: string,
) {
  const cards = [];
  let previousScore: number | null = null;
  for (const session of [...sessions].reverse()) {
    const stats = await getSessionStats(ctx, session._id);
    cards.push({
      ...withDisplayName(session, className),
      ...stats,
      scoreChange:
        stats.score !== null && previousScore !== null
          ? roundScore(stats.score - previousScore)
          : null,
    });
    if (stats.score !== null) {
      previousScore = stats.score;
    }
  }
  return cards.reverse();
}

/**
 * Finds the score shown on a class card, which is the median of the newest session with at least one graded submission.
 *
 * @param ctx The function context.
 * @param classId The class ID.
 * @returns The median score, or null if no session has a graded submission.
 */
export async function getClassScore(
  ctx: QueryCtx,
  classId: Id<"classes">,
): Promise<number | null> {
  for await (const session of ctx.db
    .query("sessions")
    .withIndex("by_classId_and_examDate", (q) => q.eq("classId", classId))
    .order("desc")) {
    const { score } = await getSessionStats(ctx, session._id);
    if (score !== null) {
      return score;
    }
  }
  return null;
}

/**
 * Builds what a submission card shows, leaving out the transcription and the grading details.
 *
 * @param ctx The function context.
 * @param submission The submission.
 * @param exam The exam date and rubric of the submission or of its session.
 * @returns The card data.
 */
export async function toSubmissionCard(
  ctx: QueryCtx,
  submission: Doc<"submissions">,
  exam: Pick<Exam, "examDate" | "rubricId">,
) {
  const coverId = submission.pageIds?.[0];
  return {
    _id: submission._id,
    _creationTime: submission._creationTime,
    classId: submission.classId,
    name: submission.name,
    studentId: submission.studentId,
    examDate: exam.examDate,
    rubricId: exam.rubricId,
    score: getScore(submission),
    badge: getSubmissionBadge(getStepStatuses(submission)),
    isUploaded: submission.uploadedAt !== undefined,
    isGradingStarted: submission.grading !== undefined,
    coverUrl: coverId ? await ctx.storage.getUrl(coverId) : null,
  };
}

/**
 * Picks the exam date, rubric and question of a session or an individual submission.
 *
 * @param source The session or individual submission.
 * @returns The exam fields.
 */
export function pickExam(source: Exam): Exam {
  return {
    examDate: source.examDate,
    rubricId: source.rubricId,
    question: source.question,
  };
}

/**
 * Finds the exam date, rubric and question of a submission, which come from its session for session submissions.
 *
 * @param ctx The function context.
 * @param submission The submission.
 * @returns The exam fields, or null if the session no longer exists.
 */
export async function getExam(
  ctx: QueryCtx,
  submission: Doc<"submissions">,
): Promise<Exam | null> {
  if (submission.kind === "individual") {
    return pickExam(submission);
  }
  const session = await ctx.db.get("sessions", submission.sessionId);
  return session ? pickExam(session) : null;
}

/**
 * Checks that a step is still running the same run, so the result of a run that was replaced is not saved.
 *
 * @param step The transcription or grading of a submission.
 * @param startedAt When the run that wants to save its result started.
 * @returns Whether the run is the current one.
 */
export function isCurrentRun(
  step: Doc<"submissions">["transcription" | "grading"],
  startedAt: number,
): boolean {
  return step?.status === "inProgress" && step.startedAt === startedAt;
}

/**
 * Starts transcribing the saved pages of a submission in the background, which clears its grading.
 *
 * @param ctx The mutation context.
 * @param submissionId The submission ID.
 * @param language The language of the feedback written by the grading that follows.
 */
export async function startTranscription(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
  language: FeedbackLanguage,
) {
  const startedAt = Date.now();
  await ctx.db.patch("submissions", submissionId, {
    transcription: { status: "inProgress", startedAt },
    grading: undefined,
    feedbackLanguage: language,
  });
  await ctx.scheduler.runAfter(0, internal.transcription.transcribe, {
    submissionId,
    startedAt,
  });
}

/**
 * Starts grading the transcription of a submission in the background.
 *
 * @param ctx The mutation context.
 * @param submissionId The submission ID.
 * @param language The language of the feedback, or undefined to keep the language saved on the submission.
 */
export async function startGrading(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
  language: FeedbackLanguage | undefined,
) {
  const startedAt = Date.now();
  await ctx.db.patch("submissions", submissionId, {
    grading: { status: "inProgress", startedAt },
    ...(language && { feedbackLanguage: language }),
  });
  await ctx.scheduler.runAfter(0, internal.grading.grade, {
    submissionId,
    startedAt,
  });
}

/**
 * Grades a submission again if its grading has started, after the rubric or the question changed.
 *
 * @param ctx The mutation context.
 * @param submission The submission.
 * @param language The language of the feedback.
 */
export async function restartGrading(
  ctx: MutationCtx,
  submission: Doc<"submissions">,
  language: FeedbackLanguage,
) {
  if (
    submission.grading !== undefined &&
    submission.transcription?.status === "done"
  ) {
    await startGrading(ctx, submission._id, language);
  }
}

/**
 * Finds the submission that a stored page image belongs to.
 *
 * @param ctx The function context.
 * @param pageId The storage ID of the image.
 * @returns The record linking the image to its submission, or null if no submission owns it.
 */
export async function findPageOwner(ctx: QueryCtx, pageId: Id<"_storage">) {
  return await ctx.db
    .query("pages")
    .withIndex("by_storageId", (q) => q.eq("storageId", pageId))
    .unique();
}

/**
 * Deletes stored page images, along with the records of which submission owns them.
 *
 * @param ctx The mutation context.
 * @param pageIds The storage IDs of the images.
 */
export async function deletePages(
  ctx: MutationCtx,
  pageIds: Id<"_storage">[] | undefined,
) {
  for (const pageId of pageIds ?? []) {
    const owner = await findPageOwner(ctx, pageId);
    if (owner) {
      await ctx.db.delete("pages", owner._id);
    }
    if (await ctx.db.system.get("_storage", pageId)) {
      await ctx.storage.delete(pageId);
    }
  }
}

/**
 * Deletes a submission with everything that belongs to it.
 *
 * @param ctx The mutation context.
 * @param submission The submission to delete.
 * @returns The ID of the deleted submission.
 */
export async function deleteSubmission(
  ctx: MutationCtx,
  submission: Doc<"submissions">,
): Promise<Id<"submissions">> {
  await deletePages(ctx, submission.pageIds);
  await ctx.db.delete("submissions", submission._id);
  return submission._id;
}

/**
 * Deletes a session with all of its submissions.
 *
 * @param ctx The mutation context.
 * @param session The session to delete.
 * @returns The IDs of the deleted submissions.
 */
export async function deleteSession(
  ctx: MutationCtx,
  session: Doc<"sessions">,
): Promise<Id<"submissions">[]> {
  const submissionIds: Id<"submissions">[] = [];
  for await (const submission of ctx.db
    .query("submissions")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))) {
    submissionIds.push(await deleteSubmission(ctx, submission));
  }
  await ctx.db.delete("sessions", session._id);
  return submissionIds;
}
