import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { WorkflowNode } from "./WorkflowNode";
import { AddStepButton } from "./AddBlockMenu";
import { BlockConfigPanel } from "./BlockConfigPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The thin connector between two blocks, with a hover-revealed "+" to insert.
function Connector({ onInsert }) {
  return (
    <div className="group/conn relative flex h-[70px] w-14 shrink-0 items-center justify-center">
      <div className="h-px w-full bg-border" />
      <ChevronRight className="absolute right-0 size-3 text-border" />
      {onInsert && (
        <AddStepButton
          render="dot"
          onSelect={onInsert}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 transition group-hover/conn:opacity-100"
        />
      )}
    </div>
  );
}

function Toolbar({ workflow, onUpdateWorkflow }) {
  const draft = workflow.status === "draft";
  return (
    <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-2.5">
      <input
        value={workflow.name}
        onChange={(e) => onUpdateWorkflow({ name: e.target.value })}
        aria-label="Workflow name"
        className="min-w-0 flex-1 truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-semibold outline-none transition hover:border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
      />
      <div className="flex shrink-0 items-center gap-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
            draft ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              draft ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
            )}
          />
          {draft ? "Draft" : "Live"}
        </span>
        {draft ? (
          <Button size="sm" onClick={() => onUpdateWorkflow({ status: "live" })}>
            Publish
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onUpdateWorkflow({ status: "draft" })}>
            Unpublish
          </Button>
        )}
      </div>
    </header>
  );
}

export function WorkflowBuilder({
  workflow,
  selectedBlockId,
  onSelectBlock,
  onUpdateWorkflow,
  onUpdateBlock,
  onInsertBlock,
  onDeleteBlock,
}) {
  const { blocks } = workflow;
  const selectedIndex = blocks.findIndex((b) => b.id === selectedBlockId);
  const selectedBlock = selectedIndex >= 0 ? blocks[selectedIndex] : null;
  const nextBlock = selectedIndex >= 0 ? blocks[selectedIndex + 1] ?? null : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Toolbar workflow={workflow} onUpdateWorkflow={onUpdateWorkflow} />

      <div className="flex min-h-0 flex-1">
        {/* Canvas */}
        <div className="relative min-h-0 flex-1 overflow-auto bg-muted/30 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="flex min-w-max items-center px-14 py-20">
            {blocks.map((block, i) => (
              <Fragment key={block.id}>
                {i > 0 && <Connector onInsert={(type) => onInsertBlock(i, type)} />}
                <WorkflowNode
                  block={block}
                  isTrigger={i === 0}
                  selected={block.id === selectedBlockId}
                  onClick={() => onSelectBlock(block.id)}
                />
              </Fragment>
            ))}
            <Connector />
            <AddStepButton
              render="ghost"
              align="right"
              onSelect={(type) => onInsertBlock(blocks.length, type)}
            />
          </div>
        </div>

        {/* Config panel */}
        {selectedBlock && (
          <BlockConfigPanel
            key={selectedBlock.id}
            block={selectedBlock}
            isTrigger={selectedIndex === 0}
            nextBlock={nextBlock}
            onClose={() => onSelectBlock(null)}
            onChange={(patch) => onUpdateBlock(selectedBlock.id, patch)}
            onConfigChange={(field, value) =>
              onUpdateBlock(selectedBlock.id, { config: { [field]: value } })
            }
            onSelectBlock={onSelectBlock}
            onAddStep={() => onInsertBlock(blocks.length, "create-task")}
            onDelete={onDeleteBlock}
          />
        )}
      </div>
    </div>
  );
}
