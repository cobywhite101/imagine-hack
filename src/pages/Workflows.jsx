import { useEffect, useState } from "react";
import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";
import { WorkflowList } from "@/features/workflows/WorkflowList";
import { WorkflowBuilder } from "@/features/workflows/WorkflowBuilder";
import { createBlock, uid } from "@/features/workflows/blockTypes";
import { Spinner } from "@/components/ui/spinner";

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
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Spinner className="size-5" />
      </div>
    );
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
