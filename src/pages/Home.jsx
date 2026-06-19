import { ChatPanel } from "@/features/chat/ChatPanel";

export function Home() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3.5">
        <div>
          <h1 className="text-sm font-semibold">Home</h1>
          <p className="font-mono text-[11px] text-muted-foreground">
            Ask your sales companion anything
          </p>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <ChatPanel />
      </div>
    </div>
  );
}
