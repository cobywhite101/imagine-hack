import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/dataClient";
import { Bot, Play, Loader2 } from "lucide-react";

export function AgentsPanel() {
  const { data: agents } = useApi(() => api.getAgents());
  const { data: initialLog } = useApi(() => api.getAgentLog());
  const [log, setLog] = useState(null);
  const [running, setRunning] = useState(false);

  const entries = log ?? initialLog ?? [];

  // Mock "run" — replace with a call to your agent backend / edge function.
  async function runAgent(agent) {
    setRunning(true);
    const steps = [
      `${agent.name} received goal`,
      `${agent.name} selected MCP tools`,
      `${agent.name} executed step`,
      `${agent.name} returned result`,
    ];
    let next = [...entries];
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 600));
      next = [
        ...next,
        { id: crypto.randomUUID(), agent: agent.name, step, at: new Date().toLocaleTimeString() },
      ];
      setLog([...next]);
    }
    setRunning(false);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        {agents?.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-red-500">
                  <Bot className="size-4" /> {a.name}
                </span>
                <Badge variant={a.status === "running" ? "default" : "secondary"}>{a.status}</Badge>
              </CardTitle>
              <CardDescription>{a.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {a.model} · {a.runs} runs
              </span>
              <Button size="sm" disabled={running} onClick={() => runAgent(a)}>
                {running ? <Loader2 className="animate-spin" /> : <Play />} Run
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>Live trace of agent steps</CardDescription>
        </CardHeader>
        <CardContent className="flex max-h-96 flex-col gap-2 overflow-auto font-mono text-xs">
          {entries.map((e) => (
            <div key={e.id} className="flex gap-2">
              <span className="text-muted-foreground">{e.at}</span>
              <span className="font-semibold">{e.agent}</span>
              <span>{e.step}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
