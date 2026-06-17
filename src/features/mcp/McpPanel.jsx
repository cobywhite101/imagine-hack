import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/dataClient";
import { Plug, Check } from "lucide-react";

export function McpPanel() {
  const { data, loading } = useApi(() => api.getMcpServers());
  const [servers, setServers] = useState(null);
  const list = servers ?? data ?? [];

  function toggle(id) {
    setServers(list.map((s) => (s.id === id ? { ...s, connected: !s.connected } : s)));
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {list.map((s) => (
        <Card key={s.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plug className="size-4" /> {s.name}
              </span>
              {s.connected && (
                <Badge className="bg-green-600">
                  <Check /> connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{s.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">{s.tools} tools</span>
            <Button size="sm" variant={s.connected ? "outline" : "default"} onClick={() => toggle(s.id)}>
              {s.connected ? "Disconnect" : "Connect"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
