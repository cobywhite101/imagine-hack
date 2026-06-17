import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/dataClient";
import { Trophy } from "lucide-react";

const medal = ["🥇", "🥈", "🥉"];

export function Leaderboard() {
  const { data: users, loading } = useApi(() => api.getLeaderboard());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-4" /> Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {users?.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
            <span className="w-6 text-center text-sm">{medal[i] ?? i + 1}</span>
            <Avatar>
              <AvatarFallback>{u.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-muted-foreground text-xs">Level {u.level}</p>
            </div>
            <Badge variant="secondary">{u.points} pts</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
