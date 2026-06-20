import { useEffect, useRef, useState } from "react";
import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";
import { ChatMessage } from "@/features/chat/ChatMessage";
import { ChatComposer } from "@/features/chat/ChatComposer";
import { Sparkles } from "lucide-react";

export function ChatPanel() {
  const { data: seed } = useApi(() => api.getChatSeed());
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef(null);

  // Hydrate from the seed once it loads.
  useEffect(() => {
    if (seed?.messages) setMessages(seed.messages);
  }, [seed]);

  // Keep pinned to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function handleSend(text) {
    setStarted(true);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text }]);
    setPending(true);
    try {
      const reply = await api.sendChatMessage({ text });
      setMessages((m) => [...m, reply]);
    } finally {
      setPending(false);
    }
  }

  const showSuggestions = !started && seed?.suggestions?.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {pending && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="size-4 animate-pulse" />
              </span>
              <span className="text-xs">Thinking…</span>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t bg-background">
        <div className="mx-auto w-full max-w-3xl px-6 py-4">
          {showSuggestions && (
            <div className="mb-3 flex flex-wrap gap-2">
              {seed.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <ChatComposer onSend={handleSend} disabled={pending} />
        </div>
      </div>
    </div>
  );
}
