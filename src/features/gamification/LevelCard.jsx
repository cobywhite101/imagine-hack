import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/dataClient";
import { Flame } from "lucide-react";

const POINTS_PER_LEVEL = 200;

export function LevelCard() {
  const { data: user } = useApi(() => api.getCurrentUser());
  if (!user) return null;

  const intoLevel = user.points % POINTS_PER_LEVEL;
  const pct = Math.round((intoLevel / POINTS_PER_LEVEL) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback>{user.avatar}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <div className="flex items-center gap-2">
              <Badge>Level {user.level}</Badge>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Flame className="size-3 text-orange-500" /> {user.streak}-day streak
              </span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1 flex justify-between text-xs">
            <span>{user.points} pts</span>
            <span>{POINTS_PER_LEVEL - intoLevel} to level {user.level + 1}</span>
          </div>
          <Progress value={pct} />
        </div>
      </CardContent>
    </Card>
  );
}
