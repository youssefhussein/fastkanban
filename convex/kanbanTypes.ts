export const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const PRIORITY_VALUES = ["high", "medium", "low", "unknown"] as const;
export type CardPriority = (typeof PRIORITY_VALUES)[number];

export const COLUMN_KIND_VALUES = ["backlog", "custom", "done"] as const;
export type ColumnKind = (typeof COLUMN_KIND_VALUES)[number];

export const DEFAULT_COLUMNS: Array<{
  name: string;
  kind: ColumnKind;
  isDeletable: boolean;
}> = [
  { name: "Backlog", kind: "backlog", isDeletable: false },
  { name: "TODO", kind: "custom", isDeletable: true },
  { name: "In-Progress", kind: "custom", isDeletable: true },
  { name: "Done", kind: "done", isDeletable: false },
];
