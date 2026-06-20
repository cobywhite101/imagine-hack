import { Plug } from "lucide-react";
import { McpPanel } from "@/features/mcp/McpPanel";

export function McpPage() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-[#101112]">
      <header className="flex h-[49px] shrink-0 items-center border-b border-[#e6e7ea] bg-white px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Plug className="size-4 shrink-0" strokeWidth={1.9} />
          <h1 className="truncate text-[14px] font-semibold leading-5 tracking-[-0.01em]">
            Connectors
          </h1>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl bg-white px-4 py-8 md:px-8">
          <McpPanel />
        </div>
      </div>
    </div>
  );
}
