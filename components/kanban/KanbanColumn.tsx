"use client";

import type { DragEvent } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CardDoc, ColumnDoc } from "./types";
import KanbanCard from "./KanbanCard";

type KanbanColumnProps = {
  column: ColumnDoc;
  cards: Array<CardDoc>;
  dragEnabled: boolean;
  onAddCard: () => void;
  onEditColumn: () => void;
  onDeleteColumn: () => Promise<void>;
  onEditCard: (card: CardDoc) => void;
  onDeleteCard: (cardId: CardDoc["_id"]) => Promise<void>;
  onDropCard: (cardId: CardDoc["_id"], toColumnId: ColumnDoc["_id"]) => Promise<void>;
};

type DragPayload = {
  cardId: CardDoc["_id"];
};

function readDragPayload(event: DragEvent<HTMLDivElement>): DragPayload | null {
  const rawPayload = event.dataTransfer.getData("application/x-fastkanban-card");
  if (rawPayload.length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawPayload) as Partial<DragPayload>;
    if (typeof parsed.cardId !== "string") {
      return null;
    }
    return { cardId: parsed.cardId as CardDoc["_id"] };
  } catch {
    return null;
  }
}

export default function KanbanColumn({
  column,
  cards,
  dragEnabled,
  onAddCard,
  onEditColumn,
  onDeleteColumn,
  onEditCard,
  onDeleteCard,
  onDropCard,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!dragEnabled) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!dragEnabled) {
      return;
    }

    event.preventDefault();
    const payload = readDragPayload(event);
    setIsDragOver(false);

    if (payload === null) {
      return;
    }

    void onDropCard(payload.cardId, column._id);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!dragEnabled) {
      return;
    }

    const related = event.relatedTarget as Node | null;
    if (related !== null && event.currentTarget.contains(related)) {
      return;
    }

    setIsDragOver(false);
  };

  return (
    <section className="min-w-80 max-w-80 rounded-2xl border-2 border-zinc-950 bg-teal-100 p-3 shadow-[6px_6px_0_0_#09090b] dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
            {column.name}
          </h3>
          <div className="mt-1">
            <Badge variant="accent">{cards.length} cards</Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onEditColumn}
            disabled={!column.isDeletable}
            className="disabled:opacity-40"
          >
            Edit
          </Button>
          {column.isDeletable && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                void onDeleteColumn();
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <Button onClick={onAddCard} size="sm" variant="secondary" className="mt-3 w-full gap-1">
        <Plus className="h-3.5 w-3.5" />
        Add Card
      </Button>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        className={`mt-3 min-h-52 space-y-2 rounded-xl border-2 p-2 transition ${
          dragEnabled
            ? isDragOver
              ? "border-zinc-950 bg-lime-200/80"
              : "border-zinc-950/50 bg-white/40 dark:bg-zinc-950/30"
            : "border-transparent"
        }`}
      >
        {cards.length === 0 ? (
          <p className="rounded-xl border-2 border-zinc-950 bg-white px-3 py-6 text-center text-xs font-semibold text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
            Empty column{dragEnabled ? " - drop a card here" : ""}
          </p>
        ) : (
          cards.map((card) => (
            <KanbanCard
              key={card._id}
              card={card}
              dragEnabled={dragEnabled}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card._id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
