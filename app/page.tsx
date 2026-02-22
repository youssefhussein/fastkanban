"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BoardToolbar from "@/components/kanban/BoardToolbar";
import CardEditorDialog from "@/components/kanban/CardEditorDialog";
import ColumnEditorDialog from "@/components/kanban/ColumnEditorDialog";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { CardDoc, CardDraft, ColumnDoc, SortMode } from "@/components/kanban/types";

const EMPTY_DRAFT: CardDraft = {
  title: "",
  description: "",
  priority: "unknown",
};

const PRIORITY_RANK: Record<CardDoc["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

type ProjectDialogState = {
  open: boolean;
  mode: "create" | "rename";
  initialValue: string;
};

type ColumnDialogState = {
  open: boolean;
  mode: "create" | "rename";
  columnId: Id<"columns"> | null;
  initialValue: string;
};

type CardDialogState = {
  open: boolean;
  mode: "create" | "edit";
  cardId: Id<"cards"> | null;
  columnId: Id<"columns"> | null;
  initialValue: CardDraft;
};

const CLOSED_PROJECT_DIALOG: ProjectDialogState = {
  open: false,
  mode: "create",
  initialValue: "",
};

const CLOSED_COLUMN_DIALOG: ColumnDialogState = {
  open: false,
  mode: "create",
  columnId: null,
  initialValue: "",
};

const CLOSED_CARD_DIALOG: CardDialogState = {
  open: false,
  mode: "create",
  cardId: null,
  columnId: null,
  initialValue: EMPTY_DRAFT,
};

const THEME_STORAGE_KEY = "fastkanban-theme";

export default function Home() {
  const router = useRouter();
  const { signOut } = useAuthActions();

  const projects = useQuery(api.projects.listMyProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark") {
      return true;
    }
    if (savedTheme === "light") {
      return false;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projectDialog, setProjectDialog] =
    useState<ProjectDialogState>(CLOSED_PROJECT_DIALOG);
  const [columnDialog, setColumnDialog] = useState<ColumnDialogState>(CLOSED_COLUMN_DIALOG);
  const [cardDialog, setCardDialog] = useState<CardDialogState>(CLOSED_CARD_DIALOG);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createProject = useMutation(api.projects.createProject);
  const renameProject = useMutation(api.projects.renameProject);
  const setAutoReset = useMutation(api.projects.setAutoReset);
  const triggerResetNow = useMutation(api.projects.triggerResetNow);

  const createColumn = useMutation(api.columns.createColumn);
  const renameColumn = useMutation(api.columns.renameColumn);
  const deleteColumn = useMutation(api.columns.deleteColumn);

  const createCard = useMutation(api.cards.createCard);
  const updateCard = useMutation(api.cards.updateCard);
  const moveCard = useMutation(api.cards.moveCard);
  const deleteCard = useMutation(api.cards.deleteCard);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const effectiveProjectId = useMemo(() => {
    if (projects === undefined || projects.length === 0) {
      return null;
    }
    if (selectedProjectId === null) {
      return projects[0]._id;
    }
    return projects.some((project) => project._id === selectedProjectId)
      ? selectedProjectId
      : projects[0]._id;
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects?.find((project) => project._id === effectiveProjectId) ?? null,
    [effectiveProjectId, projects],
  );

  const columns = useQuery(
    api.columns.listColumns,
    effectiveProjectId === null ? "skip" : { projectId: effectiveProjectId },
  );

  const cards = useQuery(
    api.cards.listBoardCards,
    effectiveProjectId === null ? "skip" : { projectId: effectiveProjectId },
  );

  const cardById = useMemo(() => {
    const mapping = new Map<CardDoc["_id"], CardDoc>();
    if (cards === undefined) {
      return mapping;
    }

    for (const card of cards) {
      mapping.set(card._id, card);
    }

    return mapping;
  }, [cards]);

  const manualCardsByColumnId = useMemo(() => {
    const grouped: Record<string, Array<CardDoc>> = {};
    if (columns === undefined || cards === undefined) {
      return grouped;
    }

    for (const column of columns) {
      grouped[column._id] = [];
    }

    for (const card of cards) {
      const bucket = grouped[card.columnId] ?? [];
      bucket.push(card);
      grouped[card.columnId] = bucket;
    }

    for (const bucket of Object.values(grouped)) {
      bucket.sort((a, b) => {
        if (a.position !== b.position) {
          return a.position - b.position;
        }
        return a._creationTime - b._creationTime;
      });
    }

    return grouped;
  }, [cards, columns]);

  const cardsByColumnId = useMemo(() => {
    if (sortMode === "manual") {
      return manualCardsByColumnId;
    }

    const reordered: Record<string, Array<CardDoc>> = {};
    for (const [columnId, bucket] of Object.entries(manualCardsByColumnId)) {
      reordered[columnId] = [...bucket].sort((a, b) => {
        const priorityGap = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (priorityGap !== 0) {
          return priorityGap;
        }
        if (a.position !== b.position) {
          return a.position - b.position;
        }
        return a._creationTime - b._creationTime;
      });
    }

    return reordered;
  }, [manualCardsByColumnId, sortMode]);

  const runAction = async (action: () => Promise<void>): Promise<void> => {
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action failed.";
      setErrorMessage(message);
    }
  };

  const handleProjectSubmit = async (name: string): Promise<void> => {
    if (projectDialog.mode === "create") {
      await runAction(async () => {
        const result = await createProject({ name });
        setSelectedProjectId(result.projectId);
      });
      return;
    }

    if (selectedProject === null) {
      return;
    }

    await runAction(async () => {
      await renameProject({ projectId: selectedProject._id, name });
    });
  };

  const handleDropCard = async (
    cardId: CardDoc["_id"],
    toColumnId: ColumnDoc["_id"],
  ): Promise<void> => {
    const card = cardById.get(cardId);
    if (card === undefined) {
      return;
    }

    const targetCards = manualCardsByColumnId[toColumnId] ?? [];
    let destination = targetCards.length;

    if (card.columnId === toColumnId) {
      const currentIndex = targetCards.findIndex((entry) => entry._id === card._id);
      if (currentIndex < 0) {
        return;
      }

      destination = Math.max(0, targetCards.length - 1);
      if (destination === currentIndex) {
        return;
      }
    }

    await runAction(async () => {
      await moveCard({
        cardId,
        toColumnId,
        toPosition: destination,
      });
    });
  };

  const handleSignOut = () => {
    void signOut().then(() => {
      router.push("/signin");
    });
  };

  if (projects === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f3e7] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <p className="animate-pulse text-sm font-black uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
          Loading workspace...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f3e7] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background:repeating-linear-gradient(-45deg,transparent,transparent_14px,rgba(24,24,27,.08)_14px,rgba(24,24,27,.08)_16px)] dark:opacity-20" />
      <div className="relative mx-auto flex w-full max-w-[96rem] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border-2 border-zinc-950 bg-lime-100 p-5 shadow-[8px_8px_0_0_#09090b] dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-700 dark:text-zinc-300">
                Fast Kanban
              </p>
              <h1 className="mt-1 text-3xl font-black text-zinc-900 dark:text-zinc-100">Task Arena</h1>
              <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Drop a card anywhere on a column to move it. Sort mode only changes visual ordering.
              </p>
            </div>
            {projects.length === 0 && (
              <Button variant="outline" onClick={handleSignOut}>
                Sign out
              </Button>
            )}
          </div>
        </header>

        {/*<Marquee
          items={[
            "Drop Anywhere In Column",
            "Drag Works In Both Sort Modes",
            "Priority = Reordered View",
            "Backlog And Done Always Present",
          ]}
        />*/}

        {projects.length === 0 ? (
          <section className="rounded-2xl border-2 border-zinc-950 bg-white p-10 text-center shadow-[8px_8px_0_0_#09090b] dark:bg-zinc-900">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
              No projects yet
            </p>
            <h2 className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">
              Create your first board
            </h2>
            <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Every project starts with Backlog, TODO, In-Progress, and Done.
            </p>
            <Button
              onClick={() =>
                setProjectDialog({
                  open: true,
                  mode: "create",
                  initialValue: "",
                })
              }
              className="mt-5"
            >
              New Project
            </Button>
          </section>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
            {selectedProject !== null && (
              <aside className="lg:sticky lg:top-4">
                <BoardToolbar
                  projects={projects}
                  selectedProjectId={effectiveProjectId}
                  onSelectProject={setSelectedProjectId}
                  onCreateProject={() =>
                    setProjectDialog({
                      open: true,
                      mode: "create",
                      initialValue: "",
                    })
                  }
                  onRenameProject={() => {
                    if (selectedProject === null) {
                      return;
                    }
                    setProjectDialog({
                      open: true,
                      mode: "rename",
                      initialValue: selectedProject.name,
                    });
                  }}
                  project={selectedProject}
                  sortMode={sortMode}
                  onSortModeChange={setSortMode}
                  onAddColumn={() =>
                    setColumnDialog({
                      open: true,
                      mode: "create",
                      columnId: null,
                      initialValue: "",
                    })
                  }
                  onToggleAutoReset={async () => {
                    await runAction(async () => {
                      await setAutoReset({
                        projectId: selectedProject._id,
                        enabled: !selectedProject.autoResetEnabled,
                      });
                    });
                  }}
                  onCleanNow={async () => {
                    await runAction(async () => {
                      await triggerResetNow({ projectId: selectedProject._id });
                    });
                  }}
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
                  darkMode={isDarkMode}
                  onToggleDarkMode={() => setIsDarkMode((current) => !current)}
                  onSignOut={handleSignOut}
                />
              </aside>
            )}

            <section className="min-w-0 space-y-4">
              {selectedProject !== null && columns !== undefined && cards !== undefined ? (
                <>
                  {sortMode !== "manual" && (
                    <section className="rounded-xl border-2 border-zinc-950 bg-amber-100 px-4 py-3 text-sm font-semibold text-zinc-800 shadow-[4px_4px_0_0_#09090b] dark:bg-zinc-900 dark:text-zinc-200">
                      Priority mode changes ordering only. Drag and drop is still enabled.
                    </section>
                  )}

                  <KanbanBoard
                    columns={columns}
                    cardsByColumnId={cardsByColumnId}
                    dragEnabled={true}
                    onAddCard={(columnId) =>
                      setCardDialog({
                        open: true,
                        mode: "create",
                        cardId: null,
                        columnId,
                        initialValue: EMPTY_DRAFT,
                      })
                    }
                    onEditColumn={(column: ColumnDoc) => {
                      if (!column.isDeletable) {
                        return;
                      }
                      setColumnDialog({
                        open: true,
                        mode: "rename",
                        columnId: column._id,
                        initialValue: column.name,
                      });
                    }}
                    onDeleteColumn={async (column: ColumnDoc) => {
                      await runAction(async () => {
                        await deleteColumn({ columnId: column._id });
                      });
                    }}
                    onEditCard={(card: CardDoc) =>
                      setCardDialog({
                        open: true,
                        mode: "edit",
                        cardId: card._id,
                        columnId: card.columnId,
                        initialValue: {
                          title: card.title,
                          description: card.description,
                          priority: card.priority,
                        },
                      })
                    }
                    onDeleteCard={async (cardId) => {
                      await runAction(async () => {
                        await deleteCard({ cardId });
                      });
                    }}
                    onDropCard={handleDropCard}
                  />
                </>
              ) : (
                <section className="rounded-2xl border-2 border-zinc-950 bg-white p-8 text-center text-sm font-semibold text-zinc-700 shadow-[6px_6px_0_0_#09090b] dark:bg-zinc-900 dark:text-zinc-300">
                  Loading board...
                </section>
              )}
            </section>
          </div>
        )}

        {errorMessage !== null && (
          <div className="rounded-xl border-2 border-zinc-950 bg-rose-200 px-4 py-3 text-sm font-semibold text-zinc-900 shadow-[4px_4px_0_0_#09090b] dark:bg-rose-900 dark:text-rose-100">
            {errorMessage}
          </div>
        )}
      </div>

      <ColumnEditorDialog
        open={projectDialog.open}
        title={projectDialog.mode === "create" ? "Create Project" : "Rename Project"}
        submitLabel={projectDialog.mode === "create" ? "Create" : "Save"}
        initialValue={projectDialog.initialValue}
        onClose={() => setProjectDialog(CLOSED_PROJECT_DIALOG)}
        onSubmit={handleProjectSubmit}
      />

      <ColumnEditorDialog
        open={columnDialog.open}
        title={columnDialog.mode === "create" ? "Add Column" : "Rename Column"}
        submitLabel={columnDialog.mode === "create" ? "Create" : "Save"}
        initialValue={columnDialog.initialValue}
        onClose={() => setColumnDialog(CLOSED_COLUMN_DIALOG)}
        onSubmit={async (name) => {
          if (effectiveProjectId === null) {
            return;
          }
          if (columnDialog.mode === "create") {
            await runAction(async () => {
              await createColumn({ projectId: effectiveProjectId, name });
            });
            return;
          }
          const columnId = columnDialog.columnId;
          if (columnId === null) {
            return;
          }
          await runAction(async () => {
            await renameColumn({ columnId, name });
          });
        }}
      />

      <CardEditorDialog
        open={cardDialog.open}
        title={cardDialog.mode === "create" ? "Create Card" : "Edit Card"}
        submitLabel={cardDialog.mode === "create" ? "Create" : "Save"}
        initialValue={cardDialog.initialValue}
        onClose={() => setCardDialog(CLOSED_CARD_DIALOG)}
        onSubmit={async (draft) => {
          if (effectiveProjectId === null) {
            return;
          }
          if (cardDialog.mode === "create") {
            await runAction(async () => {
              await createCard({
                projectId: effectiveProjectId,
                columnId: cardDialog.columnId ?? undefined,
                title: draft.title,
                description: draft.description,
                priority: draft.priority,
              });
            });
            return;
          }
          if (cardDialog.cardId === null) {
            return;
          }
          const cardId = cardDialog.cardId;
          await runAction(async () => {
            await updateCard({
              cardId,
              title: draft.title,
              description: draft.description,
              priority: draft.priority,
            });
          });
        }}
      />
    </main>
  );
}
