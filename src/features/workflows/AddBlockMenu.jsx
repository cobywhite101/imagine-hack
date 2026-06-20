import { useState } from "react";
import { Plus } from "lucide-react";
import { STEP_GROUPS, getBlockType } from "./blockTypes";
import { cn } from "@/lib/utils";

// Palette of step types an advisor can insert. Used by both the small "+" dots
// between blocks and the "Add step" ghost node at the end of the chain.
function Palette({ onSelect }) {
  return (
    <div className="max-h-[320px] overflow-y-auto p-1.5">
      {STEP_GROUPS.map((group) => (
        <div key={group.label} className="mb-1 last:mb-0">
          <div className="px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {group.label}
          </div>
          {group.types.map((type) => {
            const t = getBlockType(type);
            const Icon = t.icon;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onSelect(type)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-secondary"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-[9px] border",
                    t.chip
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">{t.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {t.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function AddStepButton({ render = "dot", align = "center", onSelect, className }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (type) => {
    onSelect(type);
    setOpen(false);
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      {render === "dot" ? (
        <button
          type="button"
          aria-label="Add step"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex size-5 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition hover:border-primary hover:text-primary",
            open ? "border-primary text-primary opacity-100" : "opacity-60 hover:opacity-100"
          )}
        >
          <Plus className="size-3" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-[68px] w-[180px] flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary",
            open && "border-primary bg-primary/5 text-primary"
          )}
        >
          <Plus className="size-4" />
          <span className="text-xs font-medium">Add step</span>
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute top-full z-50 mt-2 w-64 rounded-xl border bg-popover shadow-lg",
              align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
            )}
          >
            <Palette onSelect={handleSelect} />
          </div>
        </>
      )}
    </div>
  );
}
