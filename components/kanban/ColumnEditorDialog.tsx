"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ColumnEditorDialogProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  initialValue: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void> | void;
};

export default function ColumnEditorDialog({
  open,
  title,
  submitLabel,
  initialValue,
  onClose,
  onSubmit,
}: ColumnEditorDialogProps) {
  const [name, setName] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialValue);
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
      await onSubmit(name);
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
        className="w-full max-w-md"
      >
        <Card className="bg-lime-100 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Use short, clear column names.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              placeholder="Column name"
              autoFocus
              required
            />
            <div className="mt-4 flex justify-end gap-2">
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
