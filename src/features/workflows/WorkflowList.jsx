import { Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Left rail of an advisor's workflows. "+" creates a fresh diagram to build.
export function WorkflowList({ workflows, activeId, onSelect, onCreate }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Workflows</h2>
          <p className="text-[11px] text-muted-foreground">Automations you build</p>
        </div>
        <Button size="icon-sm" variant="outline" aria-label="New workflow" onClick={onCreate}>
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {workflows.map((wf) => {
          const active = wf.id === activeId;
          const draft = wf.status === "draft";
          return (
            <button
              key={wf.id}
              type="button"
              onClick={() => onSelect(wf.id)}
              className={cn(
                "w-full rounded-lg px-2.5 py-2 text-left transition",
                active ? "bg-secondary" : "hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center gap-2">
                <Workflow className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{wf.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 pl-6 font-mono text-[10px] text-muted-foreground">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    draft ? "bg-amber-500" : "bg-emerald-500"
                  )}
                />
                <span className="uppercase tracking-wide">{wf.status}</span>
                <span>· {wf.blocks.length} steps</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
