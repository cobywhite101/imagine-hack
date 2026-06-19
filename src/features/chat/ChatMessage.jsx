import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { DealContextCard } from "@/features/chat/DealContextCard";

/** Renders one chat message. Assistant messages may carry a rich deal/signals
 *  payload; otherwise the plain `text` is shown with preserved line breaks. */
export function ChatMessage({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm text-secondary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-3 text-sm leading-relaxed">
        {message.intro && <p className="text-foreground">{message.intro}</p>}

        {message.heading && (
          <p className="font-semibold text-foreground">{message.heading}</p>
        )}

        {message.deal && (
          <>
            <p className="text-muted-foreground">Deal context:</p>
            <DealContextCard deal={message.deal} />
          </>
        )}

        {message.signals && (
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{message.signalsTitle}</p>
            <ol className="space-y-1.5">
              {message.signals.map((s, i) => (
                <li key={s.label} className="flex gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>
                    <span className="font-semibold text-foreground">{s.label}</span>
                    <span className="text-muted-foreground"> — {s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {message.text && (
          <p className={cn("whitespace-pre-wrap text-foreground")}>{message.text}</p>
        )}
      </div>
    </div>
  );
}
