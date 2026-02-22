"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import type { ProjectDoc } from "./types";

type ProjectSwitcherProps = {
  projects: Array<ProjectDoc>;
  selectedProjectId: Id<"projects"> | null;
  onSelect: (projectId: Id<"projects">) => void;
  onCreate: () => void;
  onRename: () => void;
};

export default function ProjectSwitcher({
  projects,
  selectedProjectId,
  onSelect,
  onCreate,
  onRename,
}: ProjectSwitcherProps) {
  return (
    <section className="rounded-2xl border-2 border-zinc-950 bg-sky-100 p-3 shadow-[6px_6px_0_0_#09090b]">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedProjectId ?? ""}
          onChange={(event) => onSelect(event.target.value as Id<"projects">)}
          className="min-w-56 rounded-md border-2 border-zinc-950 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
        >
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
        <Button variant="default" size="sm" onClick={onCreate}>
          New Project
        </Button>
        <Button variant="outline" size="sm" onClick={onRename}>
          Rename
        </Button>
      </div>
    </section>
  );
}
