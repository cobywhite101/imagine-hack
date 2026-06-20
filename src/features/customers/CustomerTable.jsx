import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_VARIANT = {
  Lead: "outline",
  Qualified: "info",
  Proposal: "warning",
  Negotiation: "default",
  Won: "success",
  "Churn-risk": "error",
};

function CustomerRow({ c }) {
  return (
    <tr className="group border-b transition-colors last:border-0 hover:bg-secondary/40">
      {/* Customer */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-background"
            style={{ backgroundColor: c.accent }}
          >
            {c.avatar}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{c.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {c.contact}
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <Badge variant={STATUS_VARIANT[c.status] ?? "secondary"}>{c.status}</Badge>
      </td>

      {/* Tier / seats / value */}
      <td className="px-3 py-3 text-sm text-muted-foreground">{c.tier}</td>
      <td className="px-3 py-3 text-sm text-muted-foreground">{c.seats}</td>
      <td className="px-3 py-3 text-sm font-medium text-foreground">{c.value}</td>

      {/* Last touch */}
      <td className="px-3 py-3 text-xs text-muted-foreground">{c.lastTouch}</td>

      {/* Next action + due */}
      <td className="px-3 py-3">
        <div className="text-sm text-foreground">{c.nextAction}</div>
        <div
          className={cn(
            "text-[11px]",
            c.overdue ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {c.due}
        </div>
      </td>

      {/* Tags */}
      <td className="py-3 pl-3 pr-4">
        <div className="flex flex-wrap gap-1">
          {c.tags.map((t) => (
            <Badge key={t} variant="outline" size="sm">
              {t}
            </Badge>
          ))}
        </div>
      </td>
    </tr>
  );
}

export function CustomerTable() {
  const { data: customers, loading } = useApi(() => api.getCustomers());

  if (loading) {
    return <CustomerTableSkeleton />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-secondary/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2.5 pl-4 pr-3 font-medium">Customer</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Tier</th>
              <th className="px-3 py-2.5 font-medium">Seats</th>
              <th className="px-3 py-2.5 font-medium">Value</th>
              <th className="px-3 py-2.5 font-medium">Last touch</th>
              <th className="px-3 py-2.5 font-medium">Next action</th>
              <th className="py-2.5 pl-3 pr-4 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <CustomerRow key={c.id} c={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-secondary/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2.5 pl-4 pr-3 font-medium">Customer</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Tier</th>
              <th className="px-3 py-2.5 font-medium">Seats</th>
              <th className="px-3 py-2.5 font-medium">Value</th>
              <th className="px-3 py-2.5 font-medium">Last touch</th>
              <th className="px-3 py-2.5 font-medium">Next action</th>
              <th className="py-2.5 pl-3 pr-4 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="py-3 pl-4 pr-3">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock width={32} height={32} />
                    <div className="min-w-0 space-y-1.5">
                      <SkeletonBlock width={128} height={16} />
                      <SkeletonBlock width={168} height={12} />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3"><SkeletonBlock width={88} height={22} /></td>
                <td className="px-3 py-3"><SkeletonBlock width={64} height={16} /></td>
                <td className="px-3 py-3"><SkeletonBlock width={38} height={16} /></td>
                <td className="px-3 py-3"><SkeletonBlock width={74} height={16} /></td>
                <td className="px-3 py-3"><SkeletonBlock width={86} height={14} /></td>
                <td className="px-3 py-3">
                  <SkeletonBlock width={164} height={16} />
                  <SkeletonBlock width={78} height={12} />
                </td>
                <td className="py-3 pl-3 pr-4">
                  <div className="flex gap-1">
                    <SkeletonBlock width={58} height={22} />
                    <SkeletonBlock width={72} height={22} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
