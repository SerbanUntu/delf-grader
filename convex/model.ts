import { defaultSessionName } from "../lib/format";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Exam } from "./validation";

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
 */
export async function startTranscription(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
) {
  const startedAt = Date.now();
  await ctx.db.patch("submissions", submissionId, {
    transcription: { status: "inProgress", startedAt },
    grading: undefined,
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
 */
export async function startGrading(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
) {
  const startedAt = Date.now();
  await ctx.db.patch("submissions", submissionId, {
    grading: { status: "inProgress", startedAt },
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
 */
export async function restartGrading(
  ctx: MutationCtx,
  submission: Doc<"submissions">,
) {
  if (
    submission.grading !== undefined &&
    submission.transcription?.status === "done"
  ) {
    await startGrading(ctx, submission._id);
  }
}

/**
 * Deletes stored page images.
 *
 * @param ctx The mutation context.
 * @param pageIds The storage IDs of the images.
 */
export async function deletePages(
  ctx: MutationCtx,
  pageIds: Id<"_storage">[] | undefined,
) {
  for (const pageId of pageIds ?? []) {
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
