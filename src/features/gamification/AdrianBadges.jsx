import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/dataClient";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

export function AdrianBadges() {
  const { data: badges, loading } = useApi(() => api.getAdrianBadges());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-xs">AD</AvatarFallback>
          </Avatar>
          Adrian's Badges
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {badges?.map((b) => {
          const Icon = Icons[b.icon] ?? Icons.Star;
          return (
            <div
              key={b.id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all",
                b.earned ? "bg-card" : "opacity-40 grayscale"
              )}
              title={b.description}
            >
              <Icon className="size-6" />
              <span className="text-xs font-medium">{b.name}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
