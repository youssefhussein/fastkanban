import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { DEFAULT_COLUMNS, RESET_INTERVAL_MS } from "./kanbanTypes";

const projectDocValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  ownerId: v.id("users"),
  name: v.string(),
  autoResetEnabled: v.boolean(),
  resetIntervalMs: v.number(),
  nextResetAt: v.number(),
  lastResetAt: v.optional(v.number()),
});

function normalizeProjectName(name: string): string {
  const normalized = name.trim();
  if (normalized.length === 0) {
    throw new ConvexError("Project name is required.");
  }
  if (normalized.length > 80) {
    throw new ConvexError("Project name must be 80 characters or less.");
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

export const listMyProjects = query({
  args: {},
  returns: v.array(projectDocValidator),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
      .collect();

    return projects.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const createProject = mutation({
  args: {
    name: v.string(),
  },
  returns: v.object({
    projectId: v.id("projects"),
  }),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const now = Date.now();

    const projectId = await ctx.db.insert("projects", {
      ownerId,
      name: normalizeProjectName(args.name),
      autoResetEnabled: true,
      resetIntervalMs: RESET_INTERVAL_MS,
      nextResetAt: now + RESET_INTERVAL_MS,
      lastResetAt: undefined,
    });

    for (const [position, column] of DEFAULT_COLUMNS.entries()) {
      await ctx.db.insert("columns", {
        projectId,
        name: column.name,
        kind: column.kind,
        position,
        isDeletable: column.isDeletable,
      });
    }

    return { projectId };
  },
});

export const renameProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  returns: v.object({
    projectId: v.id("projects"),
  }),
  handler: async (ctx, args) => {
    await assertOwnedProject(ctx, args.projectId);
    await ctx.db.patch(args.projectId, {
      name: normalizeProjectName(args.name),
    });
    return { projectId: args.projectId };
  },
});

export const setAutoReset = mutation({
  args: {
    projectId: v.id("projects"),
    enabled: v.boolean(),
  },
  returns: v.object({
    projectId: v.id("projects"),
    autoResetEnabled: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const project = await assertOwnedProject(ctx, args.projectId);

    if (args.enabled) {
      await ctx.db.patch(project._id, {
        autoResetEnabled: true,
        nextResetAt: Date.now() + project.resetIntervalMs,
      });
    } else {
      await ctx.db.patch(project._id, {
        autoResetEnabled: false,
      });
    }

    return { projectId: project._id, autoResetEnabled: args.enabled };
  },
});

export const triggerResetNow = mutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.object({
    projectId: v.id("projects"),
  }),
  handler: async (ctx, args) => {
    await assertOwnedProject(ctx, args.projectId);
    await ctx.runMutation(internal.resets.resetProjectBoard, {
      projectId: args.projectId,
      reason: "manual",
    });

    return { projectId: args.projectId };
  },
});
