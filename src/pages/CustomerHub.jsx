import { CustomerTable } from "@/features/customers/CustomerTable";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export function CustomerHub() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3.5">
        <div>
          <h1 className="text-sm font-semibold">Customer Hub</h1>
          <p className="font-mono text-[11px] text-muted-foreground">
            Every deal, who needs attention, and what's next
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4" /> Add customer
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-4">
          {/* Search bar (visual) */}
          <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Search className="size-4" />
            <span className="font-mono text-xs">Search customers, tags, status…</span>
          </div>

          <CustomerTable />
        </div>
      </div>
    </div>
  );
}
