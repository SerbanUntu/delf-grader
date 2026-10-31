import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  findOwned,
  getTeacherId,
  requireOwned,
  requireTeacherId,
} from "./access";
import { deleteSession, deleteSubmission } from "./model";
import { cleanRequiredName, listLimit } from "./validation";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const teacherId = await getTeacherId(ctx);
    if (!teacherId) {
      return [];
    }
    return await ctx.db
      .query("classes")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", teacherId))
      .order("desc")
      .take(listLimit);
  },
});

export const get = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    return await findOwned(ctx, "classes", args.classId);
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
