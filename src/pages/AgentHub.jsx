import { AgentHubGrid } from "@/features/agents/AgentHubGrid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AgentHub() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3.5">
        <div>
          <h1 className="text-sm font-semibold">Agent Hub</h1>
          <p className="text-[11px] text-muted-foreground">
            Autonomous agents that work your book
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4" /> New agent
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <AgentHubGrid />
        </div>
      </div>
    </div>
  );
}
