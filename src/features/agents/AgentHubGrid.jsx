import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Bot, Play, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

function AgentCard({ agent }) {
  const running = agent.status === "running";
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Bot className="size-5" />
        </span>
        <Badge variant={running ? "success" : "outline"}>
          <span
            className={cn(
              "size-1.5 rounded-full",
              running ? "bg-success animate-pulse" : "bg-muted-foreground"
            )}
          />
          {running ? "running" : "idle"}
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{agent.name}</h3>
          <Badge variant="secondary" size="sm">
            {agent.category}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{agent.description}</p>
      </div>

      <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span>{agent.model}</span>
        <span>{agent.runs.toLocaleString()} runs</span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1">
          <Play className="size-4" /> Run
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Configure agent">
          <Settings className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

export function AgentHubGrid() {
  const { data: agents, loading } = useApi(() => api.getAgentHub());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Spinner className="size-5" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {agents.map((a) => (
        <AgentCard key={a.id} agent={a} />
      ))}
    </div>
  );
}
