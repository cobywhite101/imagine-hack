import { AgentHubGrid } from "@/features/agents/AgentHubGrid";
import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";

export function AgentHub() {
  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-[49px] shrink-0 items-center justify-between border-b border-[#e6e7ea] bg-white px-4 text-[#101112]">
        <div className="flex min-w-0 items-center gap-2">
          <Bot className="size-4 shrink-0" strokeWidth={1.9} />
          <h1 className="truncate text-[14px] font-semibold leading-5 tracking-[-0.01em]">
            Agents
          </h1>
        </div>
        <Button size="sm">
          <Plus className="size-4" /> New agent
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <AgentHubGrid />
        </div>
      </div>
    </div>
  );
}
