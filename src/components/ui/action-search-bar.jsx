import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight command palette / action search bar.
 *
 * Inspired by 21st.dev's kokonutd/action-search-bar, rebuilt without a motion
 * dependency and styled to match the customer workspace composer (light surface,
 * #266df0 accent) rather than the dark DESIGN.md tokens.
 *
 * actions: { id, label, description?, end?, icon, iconClassName?, keywords?, onSelect }[]
 */
export function ActionSearchBar({
  actions = [],
  heading = "Search Commands",
  placeholder = "What's up?",
  emptyLabel = "No matching actions",
  onClose,
  className,
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((action) =>
      [action.label, action.description, action.end, ...(action.keywords ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [actions, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function runAction(action) {
    if (!action) return;
    onClose?.();
    action.onSelect?.();
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      runAction(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_16px_48px_rgba(28,40,64,0.18),0_0_0_1px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <div className="px-3 pt-3 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black/40">
          {heading}
        </span>
        <div className="relative mt-1.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-black/35" strokeWidth={1.9} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg bg-black/[0.03] pl-8 pr-3 text-[14px] font-medium text-[#101112] outline-none transition-colors placeholder:text-black/40 focus:bg-black/[0.05]"
          />
        </div>
      </div>

      <div className="h-px bg-black/[0.06]" />

      <div className="max-h-[296px] overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-[13px] text-black/40">{emptyLabel}</p>
        ) : (
          filtered.map((action, index) => {
            const Icon = action.icon;
            const active = index === activeIndex;
            return (
              <button
                key={action.id}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runAction(action)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                  active ? "bg-black/[0.04]" : "hover:bg-black/[0.03]"
                )}
              >
                {Icon && (
                  <span className="flex size-7 shrink-0 items-center justify-center">
                    <Icon className={cn("size-[18px] text-[#266df0]", action.iconClassName)} strokeWidth={1.9} />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="shrink-0 text-[14px] font-semibold leading-5 text-[#101112]">
                    {action.label}
                  </span>
                  {action.description && (
                    <span className="truncate text-[13px] leading-5 text-black/40">
                      {action.description}
                    </span>
                  )}
                </span>
                {action.end && (
                  <span className="shrink-0 text-[12px] font-medium text-black/35">{action.end}</span>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="h-px bg-black/[0.06]" />

      <div className="flex items-center justify-between px-3 py-2 text-[11px] font-medium text-black/35">
        <span>↑↓ to navigate · ↵ to run</span>
        <span>ESC to cancel</span>
      </div>
    </div>
  );
}
