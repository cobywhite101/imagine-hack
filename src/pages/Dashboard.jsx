import { LevelCard } from "@/features/gamification/LevelCard";
import { Leaderboard } from "@/features/gamification/Leaderboard";
import { Badges } from "@/features/gamification/Badges";
import { AdrianBadges } from "@/features/gamification/AdrianBadges";
import { Quests } from "@/features/gamification/Quests";

export function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Gamified overview — points, levels, badges, and quests.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <LevelCard />
        <Quests />
        <Leaderboard />
        <Badges />
        <AdrianBadges />
      </div>
    </div>
  );
}
