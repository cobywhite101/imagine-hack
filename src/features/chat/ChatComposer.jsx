import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

/** The "Ask anything…" input pinned to the bottom of the chat. */
export function ChatComposer({ onSend, disabled }) {
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-2 shadow-xs/5 focus-within:ring-2 focus-within:ring-ring/40">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        placeholder="Ask anything…"
        className="max-h-40 w-full resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground">
          Auto
        </span>
        <Button
          size="icon-sm"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>
    </div>
  );
}
