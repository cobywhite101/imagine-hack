import { McpPanel } from "@/features/mcp/McpPanel";

export function McpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">MCP Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Connect Model Context Protocol servers that expose tools to your agents.
        </p>
      </div>
      <McpPanel />
    </div>
  );
}
