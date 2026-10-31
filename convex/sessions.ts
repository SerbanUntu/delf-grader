import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { findOwned, requireOwned, requireTeacherId } from "./access";
import { deleteSession, withDisplayName } from "./model";
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
    return sessions.map((session) =>
      withDisplayName(session, schoolClass.name),
    );
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
  },
  handler: async (ctx, args) => {
    await requireOwned(ctx, "sessions", args.sessionId);
    await ctx.db.patch("sessions", args.sessionId, {
      name: cleanName(args.name) || undefined,
      ...cleanExam(args),
    });
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
    await deleteSession(ctx, session);
    return null;
  },
});
