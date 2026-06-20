import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SkeletonBlock } from "@/components/ui/skeleton";
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
        {loading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg p-2">
              <SkeletonBlock width={24} height={16} />
              <SkeletonBlock circle width={40} height={40} />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock height={16} width="58%" />
                <SkeletonBlock height={12} width="34%" />
              </div>
              <SkeletonBlock width={72} height={22} />
            </div>
          ))}
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
