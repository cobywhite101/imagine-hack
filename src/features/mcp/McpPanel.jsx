import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { api } from "@/services/dataClient";
import { Check, HelpCircle, Plus, ShieldCheck, Users } from "lucide-react";

function getConnectorIcon(connector) {
  return connector.iconUrl ?? connector.icon_url;
}

function ConnectorCard({ connector, onToggle }) {
  const iconUrl = getConnectorIcon(connector);

  return (
    <button
      type="button"
      onClick={() => onToggle(connector.id)}
      className={cn(
        "group flex h-20 min-w-0 cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
        "hover:border-accent/60 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        connector.connected && "border-primary/40 bg-primary/5"
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center pt-0.5">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={`${connector.name} icon`}
            className="size-6 object-contain"
            loading="lazy"
          />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-md bg-secondary text-xs font-semibold">
            {connector.name.slice(0, 1)}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium leading-5 text-foreground" title={connector.name}>
          {connector.name}
        </span>
        <span className="mt-0.5 truncate text-xs leading-4 text-muted-foreground">
          {connector.description}
        </span>
      </span>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md text-foreground transition-colors group-hover:bg-secondary",
          connector.connected && "bg-primary text-primary-foreground group-hover:bg-primary"
        )}
        aria-hidden="true"
      >
        {connector.connected ? <Check className="size-3.5" /> : <Plus className="size-4" />}
      </span>
    </button>
  );
}

function AdminControls({ connectors }) {
  const connected = connectors.filter((connector) => connector.connected);
  const visibleCategories = [...new Set(connectors.map((connector) => connector.category))].length;

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Workspace Access</h3>
            <p className="text-sm text-muted-foreground">Control which connector categories are available.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <div className="text-2xl font-semibold">{visibleCategories}</div>
            <div className="mt-1 text-xs text-muted-foreground">Visible categories</div>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="text-2xl font-semibold">{connected.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Active connectors</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Users className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Team Defaults</h3>
            <p className="text-sm text-muted-foreground">New agents can use connected sources by default.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {["Require admin approval", "Allow private connectors", "Show connector activity"].map((label, index) => (
            <div key={label} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5">
              <span className="text-sm">{label}</span>
              <Badge variant="secondary">{index === 0 ? "On" : "Off"}</Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function McpPanel() {
  const { data, loading } = useApi(() => api.getConnectors());
  const [localConnectors, setLocalConnectors] = useState(null);
  const connectors = localConnectors ?? data ?? [];

  const featured = useMemo(
    () => connectors.filter((connector) => connector.featured ?? true),
    [connectors]
  );
  const connected = useMemo(
    () => connectors.filter((connector) => connector.connected),
    [connectors]
  );

  function toggle(id) {
    setLocalConnectors(
      connectors.map((connector) =>
        connector.id === id ? { ...connector, connected: !connector.connected } : connector
      )
    );
  }

  return (
    <div className="relative">
      <Tabs defaultValue="my-connectors" className="gap-0">
        <TabsList variant="ghost" className="gap-4 bg-transparent p-0 [&_[data-slot=tab-indicator]]:hidden">
          <TabsTrigger
            value="my-connectors"
            className="h-8 rounded-xl px-3 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 data-[selected]:bg-secondary aria-selected:bg-secondary"
          >
            My Connectors
          </TabsTrigger>
          <TabsTrigger
            value="admin-controls"
            className="h-8 rounded-xl px-3 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 data-[selected]:bg-secondary aria-selected:bg-secondary"
          >
            Admin Controls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-connectors" className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-medium leading-7">Featured Connectors</h2>
            <Button variant="secondary" className="h-9 rounded-lg">
              <Plus className="size-4" />
              Add Connector
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {loading && <p className="text-sm text-muted-foreground">Loading connectors...</p>}
            {featured.map((connector) => (
              <ConnectorCard key={connector.id} connector={connector} onToggle={toggle} />
            ))}
          </div>

          <h2 className="mt-10 text-xl font-medium leading-7">Connectors</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {connected.length ? (
              connected.map((connector) => (
                <ConnectorCard key={`connected-${connector.id}`} connector={connector} onToggle={toggle} />
              ))
            ) : (
              <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground shadow-sm md:col-span-2 xl:col-span-3">
                No connectors are active yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="admin-controls">
          <AdminControls connectors={connectors} />
        </TabsContent>
      </Tabs>

      <button
        type="button"
        aria-label="Connector help"
        className="fixed bottom-5 right-5 flex size-8 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HelpCircle className="size-4" />
      </button>
    </div>
  );
}
