import { CustomersGrid } from "@/features/customers/CustomersGrid";

export function CustomerHub() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3.5">
        <div>
          <h1 className="text-sm font-semibold">Customer Hub</h1>
          <p className="text-[11px] text-muted-foreground">
            Every deal, who needs attention, and what's next
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden bg-card p-6">
        <CustomersGrid />
      </div>
    </div>
  );
}
