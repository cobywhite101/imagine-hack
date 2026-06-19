import { CustomersGrid } from "@/features/customers/CustomersGrid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

      <div className="min-h-0 flex-1 overflow-hidden p-6">
        <CustomersGrid />
      </div>
    </div>
  );
}
