import { defaultSessionName } from "../lib/format";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
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
