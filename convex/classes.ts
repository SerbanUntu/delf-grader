import { v } from "convex/values";
import {
  clampClassAnalyticsSessionCount,
  computeClassAnalytics,
} from "../lib/analytics";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  findOwned,
  getTeacherId,
  requireOwned,
  requireTeacherId,
} from "./access";
import {
  collectAnalyticsResults,
  deleteSession,
  deleteSubmission,
  getClassScore,
  getScore,
} from "./model";
import { cleanRequiredName, listLimit } from "./validation";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const teacherId = await getTeacherId(ctx);
    if (!teacherId) {
      return [];
    }
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", teacherId))
      .order("desc")
      .take(listLimit);
    const cards = [];
    for (const schoolClass of classes) {
      cards.push({
        ...schoolClass,
        score: await getClassScore(ctx, schoolClass._id),
      });
    }
    return cards;
  },
});

export const get = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    return await findOwned(ctx, "classes", args.classId);
  },
});

export const getAnalytics = query({
  args: { classId: v.id("classes"), sessionCount: v.number() },
  handler: async (ctx, args) => {
    const schoolClass = await findOwned(ctx, "classes", args.classId);
    if (!schoolClass) {
      return null;
    }
    const maxSessionCount = clampClassAnalyticsSessionCount(args.sessionCount);
    const sessionExams = [];
    let oldestExamDate: string | null = null;
    for await (const session of ctx.db
      .query("sessions")
      .withIndex("by_classId_and_examDate", (q) =>
        q.eq("classId", schoolClass._id),
      )
      .order("desc")) {
      if (sessionExams.length >= maxSessionCount) {
        break;
      }
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
        .take(listLimit);
      if (submissions.some((submission) => getScore(submission) !== null)) {
        sessionExams.push({ submissions, rubricId: session.rubricId });
        oldestExamDate = session.examDate;
      }
    }
    const individualExams = [];
    if (oldestExamDate !== null) {
      const afterDate = oldestExamDate;
      for (const submission of await ctx.db
        .query("submissions")
        .withIndex("by_classId_and_kind_and_examDate", (q) =>
          q
            .eq("classId", schoolClass._id)
            .eq("kind", "individual")
            .gt("examDate", afterDate),
        )
        .take(listLimit)) {
        if (submission.kind === "individual") {
          individualExams.push({
            submissions: [submission],
            rubricId: submission.rubricId,
          });
        }
      }
    }
    const fromSessions = collectAnalyticsResults(sessionExams);
    const fromIndividuals = collectAnalyticsResults(individualExams);
    return {
      sessionCount: sessionExams.length,
      oldestExamDate,
      individualCount: fromIndividuals.results.length,
      pendingCount: fromSessions.pendingCount + fromIndividuals.pendingCount,
      ...computeClassAnalytics([
        ...fromSessions.results,
        ...fromIndividuals.results,
      ]),
    };
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const teacherId = await requireTeacherId(ctx);
    return await ctx.db.insert("classes", {
      teacherId,
      name: cleanRequiredName(args.name),
    });
  },
});

export const rename = mutation({
  args: { classId: v.id("classes"), name: v.string() },
  handler: async (ctx, args) => {
    await requireOwned(ctx, "classes", args.classId);
    await ctx.db.patch("classes", args.classId, {
      name: cleanRequiredName(args.name),
    });
    return null;
  },
});

export const remove = mutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    await requireOwned(ctx, "classes", args.classId);
    const submissionIds: Id<"submissions">[] = [];
    for await (const session of ctx.db
      .query("sessions")
      .withIndex("by_classId_and_examDate", (q) =>
        q.eq("classId", args.classId),
      )) {
      submissionIds.push(...(await deleteSession(ctx, session)));
    }
    for await (const submission of ctx.db
      .query("submissions")
      .withIndex("by_classId_and_kind_and_examDate", (q) =>
        q.eq("classId", args.classId).eq("kind", "individual"),
      )) {
      submissionIds.push(await deleteSubmission(ctx, submission));
    }
    await ctx.db.delete("classes", args.classId);
    return submissionIds;
  },
});
