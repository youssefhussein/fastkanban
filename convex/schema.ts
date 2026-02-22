import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  projects: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    autoResetEnabled: v.boolean(),
    resetIntervalMs: v.number(),
    nextResetAt: v.number(),
    lastResetAt: v.optional(v.number()),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_ownerId_and_name", ["ownerId", "name"])
    .index("by_nextResetAt", ["nextResetAt"])
    .index("by_ownerId_and_nextResetAt", ["ownerId", "nextResetAt"]),
  columns: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    kind: v.union(v.literal("backlog"), v.literal("custom"), v.literal("done")),
    position: v.number(),
    isDeletable: v.boolean(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_projectId_and_position", ["projectId", "position"])
    .index("by_projectId_and_kind", ["projectId", "kind"]),
  cards: defineTable({
    projectId: v.id("projects"),
    columnId: v.id("columns"),
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
      v.literal("unknown"),
    ),
    position: v.number(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_columnId", ["columnId"])
    .index("by_columnId_and_position", ["columnId", "position"])
    .index("by_projectId_and_priority", ["projectId", "priority"]),
});
