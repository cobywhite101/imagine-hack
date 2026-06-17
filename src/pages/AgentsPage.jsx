import { AgentsPanel } from "@/features/agents/AgentsPanel";

export function AgentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Agents</h1>
        <p className="text-muted-foreground text-sm">
          Run autonomous agents. Hit “Run” to watch a mock execution trace.
        </p>
      </div>
      <AgentsPanel />
    </div>
  );
}
