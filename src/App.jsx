import { Routes, Route, NavLink } from "react-router-dom";
import { Home } from "@/pages/Home";
import { CustomerHub } from "@/pages/CustomerHub";
import { AgentHub } from "@/pages/AgentHub";
import { dataMode } from "@/services/dataClient";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, House, Users, Bot } from "lucide-react";

const nav = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/customers", label: "Customer Hub", icon: Users },
  { to: "/agents", label: "Agent Hub", icon: Bot },
];

function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Clubhouse</div>
          <div className="font-mono text-[11px] text-muted-foreground">sales companion</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        <div className="px-2 pb-1.5 pt-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          Workspace
        </div>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                isActive
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )
            }
          >
            <Icon className="size-4 shrink-0" /> {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: data badge + user */}
      <div className="flex flex-col gap-3 border-t px-3 py-3">
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-2 py-0.5 font-mono text-xs font-medium",
            dataMode === "supabase"
              ? "bg-primary/15 text-primary"
              : "bg-secondary text-muted-foreground"
          )}
        >
          {dataMode === "supabase" ? "● live (supabase)" : "● mock data"}
        </span>
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/15 text-primary">F</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-sm font-medium">Ferdinand</div>
            <div className="font-mono text-[11px] text-muted-foreground">Account Executive</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customers" element={<CustomerHub />} />
          <Route path="/agents" element={<AgentHub />} />
        </Routes>
      </main>
    </div>
  );
}
