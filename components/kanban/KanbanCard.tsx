"use client";

import type { DragEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, LayeredCard } from "@/components/ui/card";
import type { CardDoc } from "./types";

type KanbanCardProps = {
  card: CardDoc;
  dragEnabled: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

function priorityVariant(
  priority: CardDoc["priority"],
): "danger" | "warn" | "info" | "neutral" {
  if (priority === "high") {
    return "danger";
  }
  if (priority === "medium") {
    return "warn";
  }
  if (priority === "low") {
    return "info";
  }
  return "neutral";
}

export default function KanbanCard({ card, dragEnabled, onEdit, onDelete }: KanbanCardProps) {
  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    if (!dragEnabled) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/x-fastkanban-card",
      JSON.stringify({
        cardId: card._id,
      }),
    );
  };

  return (
    <LayeredCard
      draggable={dragEnabled}
      onDragStart={handleDragStart}
      className={dragEnabled ? "cursor-grab active:cursor-grabbing" : ""}
    >
      <CardHeader className="flex items-start justify-between gap-2">
        <CardTitle className="text-zinc-900 dark:text-zinc-100">{card.title}</CardTitle>
        <Badge variant={priorityVariant(card.priority)}>{card.priority}</Badge>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
          {card.description.length === 0 ? "No description." : card.description}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className="gap-1">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              void onDelete();
            }}
            className="gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </LayeredCard>
  );
}
