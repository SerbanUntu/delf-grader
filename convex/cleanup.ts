import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { findPageOwner } from "./model";

const minimumAge = 24 * 60 * 60 * 1000;
const batchSize = 100;

export const deleteUnusedPages = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { page, isDone, continueCursor } = await ctx.db.system
      .query("_storage")
      .withIndex("by_creation_time", (q) =>
        q.lt("_creationTime", Date.now() - minimumAge),
      )
      .paginate({ numItems: batchSize, cursor: args.cursor ?? null });
    for (const file of page) {
      if (!(await findPageOwner(ctx, file._id))) {
        await ctx.storage.delete(file._id);
      }
    }
    if (!isDone) {
      await ctx.scheduler.runAfter(0, internal.cleanup.deleteUnusedPages, {
        cursor: continueCursor,
      });
    }
    return null;
  },
});
