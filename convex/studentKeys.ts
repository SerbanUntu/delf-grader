import { ConvexError, v } from "convex/values";
import { isHash } from "../lib/student-ids";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { getTeacherId, requireTeacherId } from "./access";

async function findKey(ctx: QueryCtx, teacherId: string, fingerprint?: string) {
  return await ctx.db
    .query("studentKeys")
    .withIndex("by_teacherId_and_fingerprint", (q) =>
      fingerprint === undefined
        ? q.eq("teacherId", teacherId)
        : q.eq("teacherId", teacherId).eq("fingerprint", fingerprint),
    )
    .first();
}

export const hasAny = query({
  args: {},
  handler: async (ctx) => {
    const teacherId = await getTeacherId(ctx);
    return teacherId !== null && (await findKey(ctx, teacherId)) !== null;
  },
});

export const isKnown = query({
  args: { fingerprint: v.string() },
  handler: async (ctx, args) => {
    const teacherId = await getTeacherId(ctx);
    return (
      teacherId !== null &&
      (await findKey(ctx, teacherId, args.fingerprint)) !== null
    );
  },
});

export const add = mutation({
  args: { fingerprint: v.string() },
  handler: async (ctx, args) => {
    const teacherId = await requireTeacherId(ctx);
    if (!isHash(args.fingerprint)) {
      throw new ConvexError("The student key is not valid.");
    }
    if (!(await findKey(ctx, teacherId, args.fingerprint))) {
      await ctx.db.insert("studentKeys", {
        teacherId,
        fingerprint: args.fingerprint,
      });
    }
    return null;
  },
});
