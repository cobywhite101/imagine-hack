import { Routes, Route, NavLink } from "react-router-dom";
import { Dashboard } from "@/pages/Dashboard";
import { AgentsPage } from "@/pages/AgentsPage";
import { McpPage } from "@/pages/McpPage";
import { dataMode } from "@/services/dataClient";
import { cn } from "@/lib/utils";
import { Gamepad2, Bot, Plug, LayoutDashboard } from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/mcp", label: "MCP", icon: Plug },
];

export default function App() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <Gamepad2 className="size-5" /> Ferdinand
          </span>
          <nav className="flex gap-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    isActive ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <Icon className="size-4" /> {label}
              </NavLink>
            ))}
          </nav>
          <span className="ml-auto">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-xs font-medium",
                dataMode === "supabase"
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {dataMode === "supabase" ? "● live (supabase)" : "● mock data"}
            </span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/mcp" element={<McpPage />} />
        </Routes>
      </main>
    </div>
  );
}
