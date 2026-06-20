import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/ui/skeleton";
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

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
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
    return <AgentHubGridSkeleton />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {agents.map((a) => (
        <AgentCard key={a.id} agent={a} />
      ))}
    </div>
  );
}

function AgentHubGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <SkeletonBlock width={40} height={40} />
            <SkeletonBlock width={74} height={24} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock width={132} height={18} />
              <SkeletonBlock width={66} height={20} />
            </div>
            <SkeletonBlock height={16} width="96%" />
            <SkeletonBlock height={16} width="72%" />
          </div>
          <div className="flex items-center justify-between">
            <SkeletonBlock width={92} height={14} />
            <SkeletonBlock width={72} height={14} />
          </div>
          <div className="flex gap-2">
            <SkeletonBlock height={32} className="flex-1" containerClassName="flex-1" />
            <SkeletonBlock width={32} height={32} />
          </div>
        </Card>
      ))}
    </div>
  );
}
