import { getBlockType } from "./blockTypes";
import { cn } from "@/lib/utils";

// A single block on the canvas. Click to open its config panel.
export function WorkflowNode({ block, isTrigger, selected, onClick }) {
  const type = getBlockType(block.type);
  const Icon = type.icon;

  return (
    <div className="relative shrink-0">
      {isTrigger && (
        <span className="absolute -top-2.5 left-3 z-10 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-primary">
          Trigger
        </span>
      )}

      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative flex w-[220px] flex-col gap-1 rounded-[14px] border bg-card px-2.5 pb-2.5 pt-2.5 text-left shadow-sm transition",
          selected
            ? "border-primary/50 ring-2 ring-primary/30"
            : "hover:border-primary/30 hover:shadow-md"
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-[9px] border",
              type.chip
            )}
          >
            <Icon className="size-3.5" />
          </span>
          <span className="truncate text-sm font-semibold tracking-[-0.01em]">
            {type.label}
          </span>
        </div>
        <p className="truncate pl-0.5 text-xs text-muted-foreground">
          {block.description?.trim() || type.blurb}
        </p>

        {/* Source handle on the right edge */}
        <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-primary bg-card" />
      </button>
    </div>
  );
}
