import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/dataClient";
import { CheckCircle2, Circle, Loader2, Target } from "lucide-react";

const statusIcon = {
  done: <CheckCircle2 className="size-4 text-green-500" />,
  in_progress: <Loader2 className="size-4 animate-spin text-blue-500" />,
  todo: <Circle className="text-muted-foreground size-4" />,
};

export function Quests() {
  const { data: quests, loading } = useApi(() => api.getQuests());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4" /> Quests
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {quests?.map((q) => (
          <div key={q.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
            {statusIcon[q.status]}
            <span className="flex-1 text-sm">{q.title}</span>
            <Badge variant="outline">+{q.points}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
