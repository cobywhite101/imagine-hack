import { McpPanel } from "@/features/mcp/McpPanel";

export function McpPage() {
  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto min-h-full w-full max-w-6xl bg-white px-4 pb-20 pt-10 md:px-8 xl:pt-16">
        <header className="pb-10">
          <h1 className="text-2xl font-medium leading-8">My Connectors</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Get improved, personalized answers by connecting your knowledge.
          </p>
        </header>
        <McpPanel />
      </div>
    </div>
  );
}
