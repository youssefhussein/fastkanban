import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { CardPriority } from "./kanbanTypes";

const priorityValidator = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
  v.literal("unknown"),
);

const cardDocValidator = v.object({
  _id: v.id("cards"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  columnId: v.id("columns"),
  title: v.string(),
  description: v.string(),
  priority: priorityValidator,
  position: v.number(),
  createdBy: v.id("users"),
  updatedAt: v.number(),
});

function normalizeTitle(title: string): string {
  const normalized = title.trim();
  if (normalized.length === 0) {
    throw new ConvexError("Card title is required.");
  }
  if (normalized.length > 120) {
    throw new ConvexError("Card title must be 120 characters or less.");
  }
  return normalized;
}

function normalizeDescription(description: string): string {
  if (description.length > 2000) {
    throw new ConvexError("Card description must be 2000 characters or less.");
  }
  return description;
}

function clampPosition(position: number, max: number): number {
  if (!Number.isFinite(position)) {
    return max;
  }
  const rounded = Math.floor(position);
  if (rounded < 0) {
    return 0;
  }
  if (rounded > max) {
    return max;
  }
  return rounded;
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

async function assertColumnInProject(
  ctx: QueryCtx | MutationCtx,
  columnId: Id<"columns">,
  projectId: Id<"projects">,
): Promise<Doc<"columns">> {
  const column = await ctx.db.get(columnId);
  if (column === null || column.projectId !== projectId) {
    throw new ConvexError("Column not found.");
  }
  return column;
}

async function listCardsInColumn(
  ctx: MutationCtx,
  columnId: Id<"columns">,
): Promise<Array<Doc<"cards">>> {
  return await ctx.db
    .query("cards")
    .withIndex("by_columnId_and_position", (q) => q.eq("columnId", columnId))
    .collect();
}

async function getBacklogColumn(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
): Promise<Doc<"columns">> {
  const backlogColumn = await ctx.db
    .query("columns")
    .withIndex("by_projectId_and_kind", (q) =>
      q.eq("projectId", projectId).eq("kind", "backlog"),
    )
    .first();

  if (backlogColumn === null) {
    throw new ConvexError("Backlog column is missing.");
  }

  return backlogColumn;
}

export const listBoardCards = query({
  args: {
    projectId: v.id("projects"),
    priority: v.optional(priorityValidator),
  },
  returns: v.array(cardDocValidator),
  handler: async (ctx, args) => {
    await assertOwnedProject(ctx, args.projectId);

    const columns = await ctx.db
      .query("columns")
      .withIndex("by_projectId_and_position", (q) => q.eq("projectId", args.projectId))
      .collect();

    const columnPositionById = new Map<Id<"columns">, number>();
    for (const column of columns) {
      columnPositionById.set(column._id, column.position);
    }

    const cards =
      args.priority === undefined
        ? await ctx.db
            .query("cards")
            .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
            .collect()
        : await ctx.db
            .query("cards")
            .withIndex("by_projectId_and_priority", (q) =>
              q.eq("projectId", args.projectId).eq("priority", args.priority!),
            )
            .collect();

    return cards.sort((a, b) => {
      const columnA = columnPositionById.get(a.columnId) ?? Number.MAX_SAFE_INTEGER;
      const columnB = columnPositionById.get(b.columnId) ?? Number.MAX_SAFE_INTEGER;
      if (columnA !== columnB) {
        return columnA - columnB;
      }
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      return a._creationTime - b._creationTime;
    });
  },
});

export const createCard = mutation({
  args: {
    projectId: v.id("projects"),
    columnId: v.optional(v.id("columns")),
    title: v.string(),
    description: v.string(),
    priority: v.optional(priorityValidator),
  },
  returns: v.object({
    cardId: v.id("cards"),
  }),
  handler: async (ctx, args) => {
    const createdBy = await requireUserId(ctx);
    await assertOwnedProject(ctx, args.projectId);

    const targetColumn =
      args.columnId === undefined
        ? await getBacklogColumn(ctx, args.projectId)
        : await assertColumnInProject(ctx, args.columnId, args.projectId);

    const lastCard = await ctx.db
      .query("cards")
      .withIndex("by_columnId_and_position", (q) => q.eq("columnId", targetColumn._id))
      .order("desc")
      .first();

    const cardId = await ctx.db.insert("cards", {
      projectId: args.projectId,
      columnId: targetColumn._id,
      title: normalizeTitle(args.title),
      description: normalizeDescription(args.description),
      priority: args.priority ?? "unknown",
      position: lastCard === null ? 0 : lastCard.position + 1,
      createdBy,
      updatedAt: Date.now(),
    });

    return { cardId };
  },
});

export const updateCard = mutation({
  args: {
    cardId: v.id("cards"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(priorityValidator),
  },
  returns: v.object({
    cardId: v.id("cards"),
  }),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (card === null) {
      throw new ConvexError("Card not found.");
    }

    await assertOwnedProject(ctx, card.projectId);

    const patch: {
      title?: string;
      description?: string;
      priority?: CardPriority;
      updatedAt?: number;
    } = {};

    let changed = false;

    if (args.title !== undefined) {
      patch.title = normalizeTitle(args.title);
      changed = true;
    }

    if (args.description !== undefined) {
      patch.description = normalizeDescription(args.description);
      changed = true;
    }

    if (args.priority !== undefined) {
      patch.priority = args.priority;
      changed = true;
    }

    if (!changed) {
      return { cardId: card._id };
    }

    patch.updatedAt = Date.now();
    await ctx.db.patch(card._id, patch);

    return { cardId: card._id };
  },
});

export const moveCard = mutation({
  args: {
    cardId: v.id("cards"),
    toColumnId: v.id("columns"),
    toPosition: v.number(),
  },
  returns: v.object({
    cardId: v.id("cards"),
  }),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (card === null) {
      throw new ConvexError("Card not found.");
    }

    await assertOwnedProject(ctx, card.projectId);
    await assertColumnInProject(ctx, args.toColumnId, card.projectId);

    const now = Date.now();

    if (card.columnId === args.toColumnId) {
      const cards = await listCardsInColumn(ctx, card.columnId);
      const remainingIds = cards
        .map((entry) => entry._id)
        .filter((entryId) => entryId !== card._id);
      const destination = clampPosition(args.toPosition, remainingIds.length);
      remainingIds.splice(destination, 0, card._id);

      for (const [index, cardId] of remainingIds.entries()) {
        const patch =
          cardId === card._id
            ? { position: index, updatedAt: now }
            : { position: index };
        await ctx.db.patch(cardId, patch);
      }

      return { cardId: card._id };
    }

    const sourceCards = (await listCardsInColumn(ctx, card.columnId)).filter(
      (entry) => entry._id !== card._id,
    );
    const targetCards = await listCardsInColumn(ctx, args.toColumnId);

    const destination = clampPosition(args.toPosition, targetCards.length);
    const targetIds = targetCards.map((entry) => entry._id);
    targetIds.splice(destination, 0, card._id);

    for (const [index, sourceCard] of sourceCards.entries()) {
      if (sourceCard.position !== index) {
        await ctx.db.patch(sourceCard._id, { position: index });
      }
    }

    for (const [index, cardId] of targetIds.entries()) {
      if (cardId === card._id) {
        await ctx.db.patch(card._id, {
          columnId: args.toColumnId,
          position: index,
          updatedAt: now,
        });
      } else {
        const existing = targetCards.find((entry) => entry._id === cardId);
        if (existing !== undefined && existing.position !== index) {
          await ctx.db.patch(cardId, { position: index });
        }
      }
    }

    return { cardId: card._id };
  },
});

export const reorderCardsInColumn = mutation({
  args: {
    columnId: v.id("columns"),
    orderedCardIds: v.array(v.id("cards")),
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

    const cards = await listCardsInColumn(ctx, args.columnId);
    if (cards.length !== args.orderedCardIds.length) {
      throw new ConvexError("Card order list does not match the column.");
    }

    const cardIds = new Set(cards.map((entry) => entry._id));
    const orderedIds = new Set(args.orderedCardIds);

    if (cardIds.size !== orderedIds.size) {
      throw new ConvexError("Card order list contains duplicates.");
    }

    for (const cardId of orderedIds) {
      if (!cardIds.has(cardId)) {
        throw new ConvexError("Card order list contains an invalid card ID.");
      }
    }

    for (const [index, cardId] of args.orderedCardIds.entries()) {
      await ctx.db.patch(cardId, { position: index });
    }

    return { columnId: args.columnId };
  },
});

export const deleteCard = mutation({
  args: {
    cardId: v.id("cards"),
  },
  returns: v.object({
    cardId: v.id("cards"),
  }),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (card === null) {
      throw new ConvexError("Card not found.");
    }

    await assertOwnedProject(ctx, card.projectId);

    await ctx.db.delete(card._id);

    const remaining = await listCardsInColumn(ctx, card.columnId);
    for (const [index, current] of remaining.entries()) {
      if (current.position !== index) {
        await ctx.db.patch(current._id, { position: index });
      }
    }

    return { cardId: card._id };
  },
});
