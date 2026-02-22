"use client";

import type { Id } from "@/convex/_generated/dataModel";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  LogOut,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProjectDoc, SortMode } from "./types";

type BoardToolbarProps = {
  projects: Array<ProjectDoc>;
  selectedProjectId: Id<"projects"> | null;
  onSelectProject: (projectId: Id<"projects">) => void;
  onCreateProject: () => void;
  onRenameProject: () => void;
  project: ProjectDoc;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  onAddColumn: () => void;
  onToggleAutoReset: () => Promise<void>;
  onCleanNow: () => Promise<void>;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut: () => void;
};

function formatResetTime(nextResetAt: number): string {
  return new Date(nextResetAt).toLocaleString();
}

export default function BoardToolbar({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  project,
  sortMode,
  onSortModeChange,
  onAddColumn,
  onToggleAutoReset,
  onCleanNow,
  sidebarCollapsed,
  onToggleSidebar,
  darkMode,
  onToggleDarkMode,
  onSignOut,
}: BoardToolbarProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border-2 border-zinc-950 bg-orange-100 p-3 shadow-[6px_6px_0_0_#09090b] transition-all dark:bg-zinc-900",
        sidebarCollapsed ? "w-full lg:w-20" : "w-full lg:w-80",
      )}
    >
      <div className={cn("flex gap-2", sidebarCollapsed ? "flex-col" : "items-center justify-between")}>
        <Button variant="outline" size="icon" onClick={onToggleSidebar} className="shrink-0">
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size={sidebarCollapsed ? "icon" : "sm"} onClick={onToggleDarkMode}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!sidebarCollapsed && <span className="ml-1">{darkMode ? "Light" : "Dark"} Mode</span>}
        </Button>

        <Button variant="destructive" size={sidebarCollapsed ? "icon" : "sm"} onClick={onSignOut}>
          <LogOut className="h-4 w-4" />
          {!sidebarCollapsed && <span className="ml-1">Sign Out</span>}
        </Button>
      </div>

      {!sidebarCollapsed && (
        <div className="mt-3 space-y-3">
          <Card className="bg-sky-100 dark:bg-zinc-800">
            <CardHeader>
              <CardTitle>Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="truncate">{project.name}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  {projects.map((entry) => {
                    const isActive = entry._id === selectedProjectId;
                    return (
                      <DropdownMenuItem
                        key={entry._id}
                        onClick={() => onSelectProject(entry._id)}
                        className={cn("justify-between", isActive && "border-border")}
                      >
                        <span className="truncate">{entry.name}</span>
                        {isActive ? <Badge variant="accent">Active</Badge> : null}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex gap-2">
                <Button size="sm" onClick={onCreateProject}>
                  New
                </Button>
                <Button size="sm" variant="outline" onClick={onRenameProject}>
                  Rename
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-md border-2 border-zinc-950 bg-amber-100 px-3 py-1 text-xs font-semibold text-zinc-800">
                <CalendarClock className="h-3.5 w-3.5" />
                Next reset: {formatResetTime(project.nextResetAt)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={project.autoResetEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    void onToggleAutoReset();
                  }}
                >
                  {project.autoResetEnabled ? "Auto Reset: On" : "Auto Reset: Off"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void onCleanNow();
                  }}
                >
                  Clean Now
                </Button>
                <Button variant="outline" size="sm" onClick={onAddColumn}>
                  Add Column
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-lime-100 dark:bg-zinc-800">
            <CardHeader>
              <CardTitle>Sort Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={sortMode === "manual" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onSortModeChange("manual")}
                  className="gap-1"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                  Manual
                </Button>
                <Button
                  variant={sortMode === "priority" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onSortModeChange("priority")}
                  className="gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Priority
                </Button>
              </div>
            </CardContent>
          </Card>

          <Accordion>
            <AccordionItem>
              <AccordionTrigger>Board Rules</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">Show All Cards</Badge>
                  <Badge variant="accent">Manual Drag</Badge>
                  <Badge variant="warn">Priority Sort</Badge>
                </div>
                <p className="mt-2">
                  All cards stay visible at all times. Priority only changes top-to-bottom ordering in the view.
                  Drag and drop works in both modes.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </section>
  );
}
