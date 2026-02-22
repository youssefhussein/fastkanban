import { ConvexError, v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { RESET_INTERVAL_MS } from "./kanbanTypes";

type ResetReason = "manual" | "auto";

async function performProjectReset(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  reason: ResetReason,
): Promise<{
  reason: ResetReason;
  deletedDoneCards: number;
  movedToBacklog: number;
  nextResetAt: number;
}> {
  const project = await ctx.db.get(projectId);
  if (project === null) {
    throw new ConvexError("Project not found.");
  }

  const columns = await ctx.db
    .query("columns")
    .withIndex("by_projectId_and_position", (q) => q.eq("projectId", projectId))
    .collect();

  const backlogColumn = columns.find((column) => column.kind === "backlog");
  const doneColumn = columns.find((column) => column.kind === "done");

  if (backlogColumn === undefined || doneColumn === undefined) {
    throw new ConvexError("Project is missing mandatory columns.");
  }

  const allCards = await ctx.db
    .query("cards")
    .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
    .collect();

  const doneCards = allCards.filter((card) => card.columnId === doneColumn._id);
  for (const card of doneCards) {
    await ctx.db.delete(card._id);
  }

  const columnById = new Map<Id<"columns">, Doc<"columns">>();
  for (const column of columns) {
    columnById.set(column._id, column);
  }

  const cardsToMove = allCards
    .filter((card) => card.columnId !== backlogColumn._id && card.columnId !== doneColumn._id)
    .sort((a, b) => {
      const columnA = columnById.get(a.columnId)?.position ?? Number.MAX_SAFE_INTEGER;
      const columnB = columnById.get(b.columnId)?.position ?? Number.MAX_SAFE_INTEGER;
      if (columnA !== columnB) {
        return columnA - columnB;
      }
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      return a._creationTime - b._creationTime;
    });

  const backlogCards = allCards
    .filter((card) => card.columnId === backlogColumn._id)
    .sort((a, b) => a.position - b.position);

  let nextPosition = backlogCards.length;
  const now = Date.now();

  for (const card of cardsToMove) {
    await ctx.db.patch(card._id, {
      columnId: backlogColumn._id,
      position: nextPosition,
      updatedAt: now,
    });
    nextPosition += 1;
  }

  const interval = project.resetIntervalMs > 0 ? project.resetIntervalMs : RESET_INTERVAL_MS;
  const nextResetAt = now + interval;

  await ctx.db.patch(project._id, {
    lastResetAt: now,
    nextResetAt,
  });

  return {
    reason,
    deletedDoneCards: doneCards.length,
    movedToBacklog: cardsToMove.length,
    nextResetAt,
  };
}

export const resetProjectBoard = internalMutation({
  args: {
    projectId: v.id("projects"),
    reason: v.union(v.literal("manual"), v.literal("auto")),
  },
  returns: v.object({
    reason: v.union(v.literal("manual"), v.literal("auto")),
    deletedDoneCards: v.number(),
    movedToBacklog: v.number(),
    nextResetAt: v.number(),
  }),
  handler: async (ctx, args) => {
    return await performProjectReset(ctx, args.projectId, args.reason);
  },
});

export const processDueResets = internalMutation({
  args: {},
  returns: v.object({
    checkedCount: v.number(),
    processedCount: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const dueProjects = await ctx.db
      .query("projects")
      .withIndex("by_nextResetAt", (q) => q.lte("nextResetAt", now))
      .collect();

    let processedCount = 0;
    for (const project of dueProjects) {
      if (!project.autoResetEnabled) {
        await ctx.db.patch(project._id, {
          nextResetAt: now + project.resetIntervalMs,
        });
        continue;
      }

      await performProjectReset(ctx, project._id, "auto");
      processedCount += 1;
    }

    return {
      checkedCount: dueProjects.length,
      processedCount,
    };
  },
});
