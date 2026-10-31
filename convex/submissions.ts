import { ConvexError, v } from "convex/values";
import { defaultSubmissionName, maxPageCount } from "../lib/format";
import { isGradingInputChanged } from "../lib/grading";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { findOwned, requireOwned, requireTeacherId } from "./access";
import {
  deletePages,
  deleteSubmission,
  pickExam,
  restartGrading,
  startTranscription,
  withDisplayName,
} from "./model";
import { examFields } from "./schema";
import { cleanExam, cleanName, listLimit } from "./validation";

function cleanSubmissionName(name: string): string {
  return cleanName(name) || defaultSubmissionName;
}

async function getPages(ctx: QueryCtx, submission: Doc<"submissions">) {
  const pages = [];
  for (const pageId of submission.pageIds ?? []) {
    const url = await ctx.storage.getUrl(pageId);
    if (url) {
      pages.push({ id: pageId, url });
    }
  }
  return pages;
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
    const pages = await getPages(ctx, submission);
    if (submission.kind === "individual") {
      return {
        submission,
        schoolClass,
        session: null,
        exam: pickExam(submission),
        pages,
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
      pages,
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
    const exam = cleanExam(args);
    await ctx.db.patch("submissions", submission._id, exam);
    if (isGradingInputChanged(submission, exam)) {
      await restartGrading(ctx, submission);
    }
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
    return await deleteSubmission(ctx, submission);
  },
});

export const saveUpload = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const submission = await requireOwned(
      ctx,
      "submissions",
      args.submissionId,
    );
    await deletePages(ctx, submission.pageIds);
    await ctx.db.patch("submissions", submission._id, {
      uploadedAt: Date.now(),
      pageIds: undefined,
      transcription: undefined,
      grading: undefined,
    });
    return null;
  },
});

export const generateUploadUrls = mutation({
  args: { submissionId: v.id("submissions"), count: v.number() },
  handler: async (ctx, args) => {
    await requireOwned(ctx, "submissions", args.submissionId);
    if (!Number.isInteger(args.count) || args.count < 1) {
      throw new ConvexError("There are no pages to save.");
    }
    if (args.count > maxPageCount) {
      throw new ConvexError(
        `A submission can have at most ${maxPageCount} pages.`,
      );
    }
    const urls: string[] = [];
    for (let index = 0; index < args.count; index++) {
      urls.push(await ctx.storage.generateUploadUrl());
    }
    return urls;
  },
});

export const savePages = mutation({
  args: {
    submissionId: v.id("submissions"),
    pageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const submission = await requireOwned(
      ctx,
      "submissions",
      args.submissionId,
    );
    if (submission.uploadedAt === undefined) {
      throw new ConvexError("Upload the submission first.");
    }
    if (args.pageIds.length === 0) {
      throw new ConvexError("There are no pages to save.");
    }
    if (args.pageIds.length > maxPageCount) {
      throw new ConvexError(
        `A submission can have at most ${maxPageCount} pages.`,
      );
    }
    for (const pageId of args.pageIds) {
      const file = await ctx.db.system.get("_storage", pageId);
      if (file?.contentType !== "image/jpeg") {
        throw new ConvexError("Every page must be saved as a JPEG image.");
      }
    }
    await deletePages(
      ctx,
      submission.pageIds?.filter((pageId) => !args.pageIds.includes(pageId)),
    );
    await ctx.db.patch("submissions", submission._id, {
      pageIds: args.pageIds,
    });
    await startTranscription(ctx, submission._id);
    return null;
  },
});
