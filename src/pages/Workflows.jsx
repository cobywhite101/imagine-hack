import { useEffect, useState } from "react";
import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";
import { WorkflowList } from "@/features/workflows/WorkflowList";
import { WorkflowBuilder } from "@/features/workflows/WorkflowBuilder";
import { createBlock, uid } from "@/features/workflows/blockTypes";
import { SkeletonBlock } from "@/components/ui/skeleton";

export function Workflows() {
  const { data, loading } = useApi(() => api.getWorkflows());
  const [workflows, setWorkflows] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  // Seed local (editable) state once mock/live data arrives.
  useEffect(() => {
    if (!data) return;
    setWorkflows(data);
    setActiveId((id) => id ?? data[0]?.id ?? null);
  }, [data]);

  const active = workflows.find((w) => w.id === activeId) ?? null;

  const patchActive = (updater) =>
    setWorkflows((ws) => ws.map((w) => (w.id === activeId ? updater(w) : w)));

  const updateWorkflow = (patch) => patchActive((w) => ({ ...w, ...patch }));

  const updateBlock = (blockId, patch) =>
    patchActive((w) => ({
      ...w,
      status: "draft",
      blocks: w.blocks.map((b) =>
        b.id === blockId
          ? { ...b, ...patch, config: patch.config ? { ...b.config, ...patch.config } : b.config }
          : b
      ),
    }));

  const insertBlock = (index, type) => {
    const block = createBlock(type);
    patchActive((w) => {
      const blocks = [...w.blocks];
      blocks.splice(index, 0, block);
      return { ...w, status: "draft", blocks };
    });
    setSelectedBlockId(block.id);
  };

  const deleteBlock = (blockId) => {
    patchActive((w) => ({
      ...w,
      status: "draft",
      blocks: w.blocks.filter((b) => b.id !== blockId),
    }));
    setSelectedBlockId((id) => (id === blockId ? null : id));
  };

  const createWorkflow = () => {
    const workflow = {
      id: `wf-${uid()}`,
      name: "Untitled workflow",
      description: "",
      status: "draft",
      blocks: [createBlock("record-updated")],
    };
    setWorkflows((ws) => [workflow, ...ws]);
    setActiveId(workflow.id);
    setSelectedBlockId(null);
  };

  const selectWorkflow = (id) => {
    setActiveId(id);
    setSelectedBlockId(null);
  };

  if (loading) {
    return <WorkflowsSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 bg-background">
      <WorkflowList
        workflows={workflows}
        activeId={activeId}
        onSelect={selectWorkflow}
        onCreate={createWorkflow}
      />
      {active ? (
        <WorkflowBuilder
          workflow={active}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onUpdateWorkflow={updateWorkflow}
          onUpdateBlock={updateBlock}
          onInsertBlock={insertBlock}
          onDeleteBlock={deleteBlock}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No workflow selected.
        </div>
      )}
    </div>
  );
}

function WorkflowsSkeleton() {
  return (
    <div className="flex h-full min-h-0 bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="space-y-1.5">
            <SkeletonBlock width={84} height={16} />
            <SkeletonBlock width={118} height={12} />
          </div>
          <SkeletonBlock width={32} height={32} />
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-lg px-2.5 py-2">
              <div className="flex items-center gap-2">
                <SkeletonBlock width={16} height={16} />
                <SkeletonBlock width={index % 2 ? 136 : 172} height={16} />
              </div>
              <div className="mt-2 pl-6">
                <SkeletonBlock width={104} height={11} />
              </div>
            </div>
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-2.5">
          <SkeletonBlock height={28} width={260} />
          <div className="flex items-center gap-2.5">
            <SkeletonBlock height={24} width={62} />
            <SkeletonBlock height={32} width={76} />
          </div>
        </header>
        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/30 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="flex min-w-max items-center px-14 py-20">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center">
                {index > 0 ? (
                  <div className="mx-4 h-px w-14 bg-border" />
                ) : null}
                <div className="w-[250px] rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock width={34} height={34} />
                    <div className="min-w-0 flex-1">
                      <SkeletonBlock height={16} width="76%" />
                      <SkeletonBlock height={12} width="52%" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <SkeletonBlock height={12} width="94%" />
                    <SkeletonBlock height={12} width="68%" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
