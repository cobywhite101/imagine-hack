import { Users } from "lucide-react";
import { CustomersGrid } from "@/features/customers/CustomersGrid";

export function CustomerHub() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[49px] w-full shrink-0 items-center border-b border-[#e6e7ea] bg-white px-4 text-[#101112]">
        <div className="flex min-w-0 items-center gap-2">
          <Users className="size-4 shrink-0" strokeWidth={1.9} />
          <h1 className="truncate text-[14px] font-semibold leading-5 tracking-[-0.01em]">
            Customers
          </h1>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden bg-card p-6">
        <CustomersGrid />
      </div>
    </div>
  );
}
