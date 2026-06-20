import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/dataClient";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

export function Badges() {
  const { data: badges, loading } = useApi(() => api.getBadges());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-pink-500">
          <Icons.Award className="size-4" /> Badges
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2 rounded-lg border p-3">
              <SkeletonBlock width={24} height={24} />
              <SkeletonBlock width={64} height={14} />
            </div>
          ))}
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
