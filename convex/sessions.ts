import { v } from "convex/values";
import { computeSessionAnalytics } from "../lib/analytics";
import { isGradingInputChanged } from "../lib/grading";
import { feedbackLanguageValidator } from "../lib/languages";
import { getRubric } from "../lib/rubrics";
import { mutation, query } from "./_generated/server";
import { findOwned, requireOwned, requireTeacherId } from "./access";
import {
  deleteSession,
  restartGrading,
  withDisplayName,
  withSessionStats,
} from "./model";
import { examFields } from "./schema";
import { cleanExam, cleanName, listLimit } from "./validation";

export const listByClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const schoolClass = await findOwned(ctx, "classes", args.classId);
    if (!schoolClass) {
      return [];
    }
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_classId_and_examDate", (q) =>
        q.eq("classId", schoolClass._id),
      )
      .order("desc")
      .take(listLimit);
    return await withSessionStats(ctx, sessions, schoolClass.name);
  },
});

export const get = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await findOwned(ctx, "sessions", args.sessionId);
    if (!session) {
      return null;
    }
    const schoolClass = await ctx.db.get("classes", session.classId);
    if (!schoolClass) {
      return null;
    }
    return {
      session: withDisplayName(session, schoolClass.name),
      schoolClass,
    };
  },
});

export const getAnalytics = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await findOwned(ctx, "sessions", args.sessionId);
    if (!session) {
      return null;
    }
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
      .take(listLimit);
    const results = submissions.flatMap((submission) =>
      submission.grading?.status === "done" ? [submission.grading.result] : [],
    );
    const pendingCount = submissions.filter(
      ({ grading }) =>
        grading?.status === "inProgress" ||
        (grading?.status === "done" &&
          grading.result.rubricId !== session.rubricId),
    ).length;
    return {
      rubricId: session.rubricId,
      pendingCount,
      ...computeSessionAnalytics(getRubric(session.rubricId), results),
    };
  },
});

export const create = mutation({
  args: {
    classId: v.id("classes"),
    name: v.string(),
    ...examFields,
  },
  handler: async (ctx, args) => {
    const teacherId = await requireTeacherId(ctx);
    await requireOwned(ctx, "classes", args.classId);
    return await ctx.db.insert("sessions", {
      teacherId,
      classId: args.classId,
      name: cleanName(args.name) || undefined,
      ...cleanExam(args),
    });
  },
});

export const update = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
    ...examFields,
    language: feedbackLanguageValidator,
  },
  handler: async (ctx, args) => {
    const session = await requireOwned(ctx, "sessions", args.sessionId);
    const exam = cleanExam(args);
    await ctx.db.patch("sessions", session._id, {
      name: cleanName(args.name) || undefined,
      ...exam,
    });
    if (isGradingInputChanged(session, exam)) {
      for await (const submission of ctx.db
        .query("submissions")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))) {
        await restartGrading(ctx, submission, args.language);
      }
    }
    return null;
  },
});

export const rename = mutation({
  args: { sessionId: v.id("sessions"), name: v.string() },
  handler: async (ctx, args) => {
    await requireOwned(ctx, "sessions", args.sessionId);
    await ctx.db.patch("sessions", args.sessionId, {
      name: cleanName(args.name) || undefined,
    });
    return null;
  },
});

export const remove = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await requireOwned(ctx, "sessions", args.sessionId);
    return await deleteSession(ctx, session);
  },
});
