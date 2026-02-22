"use client";

import type { CardDoc, ColumnDoc } from "./types";
import KanbanColumn from "./KanbanColumn";

type KanbanBoardProps = {
  columns: Array<ColumnDoc>;
  cardsByColumnId: Record<string, Array<CardDoc>>;
  dragEnabled: boolean;
  onAddCard: (columnId: ColumnDoc["_id"]) => void;
  onEditColumn: (column: ColumnDoc) => void;
  onDeleteColumn: (column: ColumnDoc) => Promise<void>;
  onEditCard: (card: CardDoc) => void;
  onDeleteCard: (cardId: CardDoc["_id"]) => Promise<void>;
  onDropCard: (cardId: CardDoc["_id"], toColumnId: ColumnDoc["_id"]) => Promise<void>;
};

export default function KanbanBoard({
  columns,
  cardsByColumnId,
  dragEnabled,
  onAddCard,
  onEditColumn,
  onDeleteColumn,
  onEditCard,
  onDeleteCard,
  onDropCard,
}: KanbanBoardProps) {
  return (
    <section className="overflow-x-auto pb-2">
      <div className="flex min-h-[28rem] gap-4 pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column._id}
            column={column}
            cards={cardsByColumnId[column._id] ?? []}
            dragEnabled={dragEnabled}
            onAddCard={() => onAddCard(column._id)}
            onEditColumn={() => onEditColumn(column)}
            onDeleteColumn={() => onDeleteColumn(column)}
            onEditCard={onEditCard}
            onDeleteCard={onDeleteCard}
            onDropCard={onDropCard}
          />
        ))}
      </div>
    </section>
  );
}
