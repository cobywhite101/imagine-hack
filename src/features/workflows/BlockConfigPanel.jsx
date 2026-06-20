import { useId } from "react";
import { ChevronDown, ChevronRight, Trash2, X } from "lucide-react";
import { getBlockType } from "./blockTypes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-lg border bg-card text-sm shadow-xs/5 outline-none transition placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

function Field({ field, value, onChange }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {field.label}
        {field.optional && (
          <span className="ml-1 text-muted-foreground/60">(optional)</span>
        )}
      </label>

      {field.type === "select" ? (
        <div className="relative">
          <select
            id={id}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={cn(fieldClasses, "h-9 cursor-pointer appearance-none pl-3 pr-8")}
          >
            {field.optional && <option value="">{field.placeholder ?? "—"}</option>}
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      ) : field.type === "textarea" ? (
        <textarea
          id={id}
          rows={4}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClasses, "resize-none px-3 py-2 leading-relaxed")}
        />
      ) : (
        <input
          id={id}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClasses, "h-9 px-3")}
        />
      )}

      {field.help && (
        <p className="text-[11px] leading-snug text-muted-foreground/80">{field.help}</p>
      )}
    </div>
  );
}

export function BlockConfigPanel({
  block,
  isTrigger,
  nextBlock,
  onClose,
  onChange,
  onConfigChange,
  onSelectBlock,
  onAddStep,
  onDelete,
}) {
  const type = getBlockType(block.type);
  const Icon = type.icon;

  return (
    <aside className="flex w-[380px] shrink-0 flex-col overflow-y-auto border-l bg-card">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-[10px] border",
                type.chip
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">{type.label}</div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                {type.group}
              </div>
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" aria-label="Close panel" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <textarea
          rows={1}
          value={block.description ?? ""}
          placeholder="Add a description..."
          onChange={(e) => onChange({ description: e.target.value })}
          className={cn(fieldClasses, "resize-none px-2.5 py-1.5 text-[13px]")}
        />
      </div>

      <div className="h-px bg-border" />

      {/* Configuration */}
      <div className="flex flex-col gap-4 p-4">
        <div className="text-sm font-semibold">Configuration</div>
        {type.fields.length > 0 ? (
          type.fields.map((field) => (
            <Field
              key={field.key}
              field={field}
              value={block.config?.[field.key]}
              onChange={(v) => onConfigChange(field.key, v)}
            />
          ))
        ) : (
          <p className="text-xs text-muted-foreground">This block has no configuration.</p>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Next step */}
      <div className="flex flex-col gap-3 p-4">
        <div>
          <div className="text-sm font-medium">Next step</div>
          <div className="text-xs text-muted-foreground">
            Define what happens after this block
          </div>
        </div>

        {nextBlock ? (
          <button
            type="button"
            onClick={() => onSelectBlock(nextBlock.id)}
            className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left transition hover:border-primary/40 hover:bg-secondary/40"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {(() => {
                const nt = getBlockType(nextBlock.type);
                const NextIcon = nt.icon;
                return (
                  <>
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-[9px] border",
                        nt.chip
                      )}
                    >
                      <NextIcon className="size-3.5" />
                    </span>
                    <span className="truncate text-sm font-medium">{nt.label}</span>
                  </>
                );
              })()}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={onAddStep}>
            Add a step
          </Button>
        )}
      </div>

      {/* Footer: delete (not allowed for the trigger) */}
      {!isTrigger && (
        <div className="mt-auto border-t p-4">
          <Button
            variant="destructive-outline"
            size="sm"
            className="w-full"
            onClick={() => onDelete(block.id)}
          >
            <Trash2 className="size-4" /> Delete step
          </Button>
        </div>
      )}
    </aside>
  );
}
