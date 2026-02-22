"use client";

import { FormEvent, useEffect, useState } from "react";
import { PRIORITY_VALUES } from "@/convex/kanbanTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CardDraft } from "./types";

type CardEditorDialogProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  initialValue: CardDraft;
  onClose: () => void;
  onSubmit: (value: CardDraft) => Promise<void> | void;
};

export default function CardEditorDialog({
  open,
  title,
  submitLabel,
  initialValue,
  onClose,
  onSubmit,
}: CardEditorDialogProps) {
  const [draft, setDraft] = useState<CardDraft>(initialValue);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(initialValue);
      setSubmitting(false);
    }
  }, [initialValue, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(draft);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4">
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="w-full max-w-xl"
      >
        <Card className="bg-sky-100 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Define what done looks like and set the urgency.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                  Title
                </label>
                <Input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  maxLength={120}
                  placeholder="What needs to be done?"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                  Description
                </label>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  className="min-h-28 w-full rounded-md border-2 border-zinc-950 bg-white px-3 py-2 text-zinc-900 shadow-[3px_3px_0_0_#09090b] outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
                  maxLength={2000}
                  placeholder="Context, constraints, acceptance criteria"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                  Priority
                </label>
                <Select
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, priority: event.target.value as CardDraft["priority"] }))
                  }
                >
                  {PRIORITY_VALUES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : submitLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
