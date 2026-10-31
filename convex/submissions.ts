import { ConvexError, v } from "convex/values";
import { defaultSubmissionName } from "../lib/format";
import { mutation, query } from "./_generated/server";
import { findOwned, requireOwned, requireTeacherId } from "./access";
import { deleteSubmission, pickExam, withDisplayName } from "./model";
import { examFields } from "./schema";
import { cleanExam, cleanName, listLimit } from "./validation";

function cleanSubmissionName(name: string): string {
  return cleanName(name) || defaultSubmissionName;
}

export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await findOwned(ctx, "sessions", args.sessionId);
    if (!session) {
      return [];
    }
    return await ctx.db
      .query("submissions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
      .order("desc")
      .take(listLimit);
  },
});

export const listIndividual = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const schoolClass = await findOwned(ctx, "classes", args.classId);
    if (!schoolClass) {
      return [];
    }
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_classId_and_kind_and_examDate", (q) =>
        q.eq("classId", schoolClass._id).eq("kind", "individual"),
      )
      .order("desc")
      .take(listLimit);
    return submissions.filter((submission) => submission.kind === "individual");
  },
});

export const get = query({
  args: { submissionId: v.string() },
  handler: async (ctx, args) => {
    const submission = await findOwned(ctx, "submissions", args.submissionId);
    if (!submission) {
      return null;
    }
    const schoolClass = await ctx.db.get("classes", submission.classId);
    if (!schoolClass) {
      return null;
    }
    if (submission.kind === "individual") {
      return {
        submission,
        schoolClass,
        session: null,
        exam: pickExam(submission),
      };
    }
    const session = await ctx.db.get("sessions", submission.sessionId);
    if (!session) {
      return null;
    }
    return {
      submission,
      schoolClass,
      session: withDisplayName(session, schoolClass.name),
      exam: pickExam(session),
    };
  },
});

export const createInSession = mutation({
  args: { sessionId: v.id("sessions"), name: v.string() },
  handler: async (ctx, args) => {
    const teacherId = await requireTeacherId(ctx);
    const session = await requireOwned(ctx, "sessions", args.sessionId);
    return await ctx.db.insert("submissions", {
      kind: "session",
      teacherId,
      classId: session.classId,
      sessionId: session._id,
      name: cleanSubmissionName(args.name),
    });
  },
});

export const createIndividual = mutation({
  args: { classId: v.id("classes"), name: v.string(), ...examFields },
  handler: async (ctx, args) => {
    const teacherId = await requireTeacherId(ctx);
    await requireOwned(ctx, "classes", args.classId);
    return await ctx.db.insert("submissions", {
      kind: "individual",
      teacherId,
      classId: args.classId,
      name: cleanSubmissionName(args.name),
      ...cleanExam(args),
    });
  },
});

export const rename = mutation({
  args: { submissionId: v.id("submissions"), name: v.string() },
  handler: async (ctx, args) => {
    await requireOwned(ctx, "submissions", args.submissionId);
    await ctx.db.patch("submissions", args.submissionId, {
      name: cleanSubmissionName(args.name),
    });
    return null;
  },
});

export const updateExam = mutation({
  args: { submissionId: v.id("submissions"), ...examFields },
  handler: async (ctx, args) => {
    const submission = await requireOwned(
      ctx,
      "submissions",
      args.submissionId,
    );
    if (submission.kind !== "individual") {
      throw new ConvexError(
        "The exam of a session is changed from the session page.",
      );
    }
    await ctx.db.patch("submissions", args.submissionId, cleanExam(args));
    return null;
  },
});

export const remove = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const submission = await requireOwned(
      ctx,
      "submissions",
      args.submissionId,
    );
    await deleteSubmission(ctx, submission);
    return null;
  },
});
