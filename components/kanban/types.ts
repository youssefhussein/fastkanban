import type { Doc } from "@/convex/_generated/dataModel";
import type { CardPriority } from "@/convex/kanbanTypes";

export type ProjectDoc = Doc<"projects">;
export type ColumnDoc = Doc<"columns">;
export type CardDoc = Doc<"cards">;

export type SortMode = "manual" | "priority";

export type CardDraft = {
  title: string;
  description: string;
  priority: CardPriority;
};
