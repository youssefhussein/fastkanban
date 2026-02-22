import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const columnDocValidator = v.object({
  _id: v.id("columns"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  name: v.string(),
  kind: v.union(v.literal("backlog"), v.literal("custom"), v.literal("done")),
  position: v.number(),
  isDeletable: v.boolean(),
});

function normalizeColumnName(name: string): string {
  const normalized = name.trim();
  if (normalized.length === 0) {
    throw new ConvexError("Column name is required.");
  }
  if (normalized.length > 40) {
    throw new ConvexError("Column name must be 40 characters or less.");
  }
  return normalized;
}

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Unauthorized.");
  }
  return userId;
}

async function assertOwnedProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
): Promise<Doc<"projects">> {
  const userId = await requireUserId(ctx);
  const project = await ctx.db.get(projectId);
  if (project === null || project.ownerId !== userId) {
    throw new ConvexError("Project not found.");
  }
  return project;
}

async function resequenceColumnPositions(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<void> {
  const columns = await ctx.db
    .query("columns")
    .withIndex("by_projectId_and_position", (q) => q.eq("projectId", projectId))
    .collect();

  for (const [index, column] of columns.entries()) {
    if (column.position !== index) {
      await ctx.db.patch(column._id, { position: index });
    }
  }
}

export const listColumns = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(columnDocValidator),
  handler: async (ctx, args) => {
    await assertOwnedProject(ctx, args.projectId);
    return await ctx.db
      .query("columns")
      .withIndex("by_projectId_and_position", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const createColumn = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  returns: v.object({
    columnId: v.id("columns"),
  }),
  handler: async (ctx, args) => {
    await assertOwnedProject(ctx, args.projectId);
    const lastColumn = await ctx.db
      .query("columns")
      .withIndex("by_projectId_and_position", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .first();

    const columnId = await ctx.db.insert("columns", {
      projectId: args.projectId,
      name: normalizeColumnName(args.name),
      kind: "custom",
      position: lastColumn === null ? 0 : lastColumn.position + 1,
      isDeletable: true,
    });

    return { columnId };
  },
});

export const renameColumn = mutation({
  args: {
    columnId: v.id("columns"),
    name: v.string(),
  },
  returns: v.object({
    columnId: v.id("columns"),
  }),
  handler: async (ctx, args) => {
    const column = await ctx.db.get(args.columnId);
    if (column === null) {
      throw new ConvexError("Column not found.");
    }

    await assertOwnedProject(ctx, column.projectId);

    if (!column.isDeletable) {
      throw new ConvexError("Mandatory columns cannot be renamed.");
    }

    await ctx.db.patch(column._id, {
      name: normalizeColumnName(args.name),
    });

    return { columnId: column._id };
  },
});

export const deleteColumn = mutation({
  args: {
    columnId: v.id("columns"),
  },
  returns: v.object({
    deletedColumnId: v.id("columns"),
    movedCardCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const column = await ctx.db.get(args.columnId);
    if (column === null) {
      throw new ConvexError("Column not found.");
    }

    await assertOwnedProject(ctx, column.projectId);

    if (!column.isDeletable || column.kind !== "custom") {
      throw new ConvexError("Backlog and Done columns cannot be deleted.");
    }

    const backlogColumn = await ctx.db
      .query("columns")
      .withIndex("by_projectId_and_kind", (q) =>
        q.eq("projectId", column.projectId).eq("kind", "backlog"),
      )
      .first();

    if (backlogColumn === null) {
      throw new ConvexError("Backlog column is missing.");
    }

    const cardsToMove = await ctx.db
      .query("cards")
      .withIndex("by_columnId_and_position", (q) => q.eq("columnId", column._id))
      .collect();

    const lastBacklogCard = await ctx.db
      .query("cards")
      .withIndex("by_columnId_and_position", (q) => q.eq("columnId", backlogColumn._id))
      .order("desc")
      .first();

    let nextPosition = lastBacklogCard === null ? 0 : lastBacklogCard.position + 1;

    for (const card of cardsToMove) {
      await ctx.db.patch(card._id, {
        columnId: backlogColumn._id,
        position: nextPosition,
        updatedAt: Date.now(),
      });
      nextPosition += 1;
    }

    await ctx.db.delete(column._id);
    await resequenceColumnPositions(ctx, column.projectId);

    return { deletedColumnId: column._id, movedCardCount: cardsToMove.length };
  },
});

export const reorderColumns = mutation({
  args: {
    projectId: v.id("projects"),
    orderedColumnIds: v.array(v.id("columns")),
  },
  returns: v.object({
    projectId: v.id("projects"),
  }),
  handler: async (ctx, args) => {
    await assertOwnedProject(ctx, args.projectId);

    const existingColumns = await ctx.db
      .query("columns")
      .withIndex("by_projectId_and_position", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (existingColumns.length !== args.orderedColumnIds.length) {
      throw new ConvexError("Column order list does not match project columns.");
    }

    const existingIds = new Set(existingColumns.map((column) => column._id));
    const requestedIds = new Set(args.orderedColumnIds);

    if (existingIds.size !== requestedIds.size) {
      throw new ConvexError("Column order list contains duplicate IDs.");
    }

    for (const id of requestedIds) {
      if (!existingIds.has(id)) {
        throw new ConvexError("Column order list contains an invalid column ID.");
      }
    }

    for (const [index, columnId] of args.orderedColumnIds.entries()) {
      await ctx.db.patch(columnId, { position: index });
    }

    return { projectId: args.projectId };
  },
});
