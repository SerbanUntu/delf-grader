import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

type OwnedTable = "classes" | "sessions" | "submissions";

/**
 * Reads the ID of the signed-in teacher.
 *
 * @param ctx The function context.
 * @returns The teacher's ID, or null when nobody is signed in.
 */
export async function getTeacherId(ctx: QueryCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.tokenIdentifier ?? null;
}

/**
 * Reads the ID of the signed-in teacher.
 *
 * @param ctx The function context.
 * @returns The teacher's ID.
 * @throws If nobody is signed in.
 */
export async function requireTeacherId(ctx: QueryCtx): Promise<string> {
  const teacherId = await getTeacherId(ctx);
  if (!teacherId) {
    throw new ConvexError("You must be signed in.");
  }
  return teacherId;
}

/**
 * Finds a class, session or submission that belongs to the signed-in teacher.
 *
 * @param ctx The function context.
 * @param table The table of the item.
 * @param id The item's ID, which may come from a URL and be malformed.
 * @returns The item, or null if it does not exist, belongs to another teacher or nobody is signed in.
 */
export async function findOwned<Table extends OwnedTable>(
  ctx: QueryCtx,
  table: Table,
  id: string,
): Promise<Doc<Table> | null> {
  const teacherId = await getTeacherId(ctx);
  const normalizedId = ctx.db.normalizeId(table, id);
  if (!teacherId || !normalizedId) {
    return null;
  }
  const item = await ctx.db.get(normalizedId);
  return item?.teacherId === teacherId ? item : null;
}

/**
 * Finds a class, session or submission that belongs to the signed-in teacher.
 *
 * @param ctx The function context.
 * @param table The table of the item.
 * @param id The item's ID.
 * @returns The item.
 * @throws If the item does not exist, belongs to another teacher or nobody is signed in.
 */
export async function requireOwned<Table extends OwnedTable>(
  ctx: QueryCtx,
  table: Table,
  id: Id<Table>,
): Promise<Doc<Table>> {
  const item = await findOwned(ctx, table, id);
  if (!item) {
    throw new ConvexError("This item does not exist or was deleted.");
  }
  return item;
}
