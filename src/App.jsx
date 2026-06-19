import { Routes, Route, NavLink } from "react-router-dom";
import { Home } from "@/pages/Home";
import { CustomerHub } from "@/pages/CustomerHub";
import { CustomerWorkspace } from "@/pages/CustomerWorkspace";
import { AgentHub } from "@/pages/AgentHub";
import { dataMode } from "@/services/dataClient";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronsUpDown, House, Users, Bot } from "lucide-react";

const nav = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/customers", label: "Customer Hub", icon: Users },
  { to: "/agents", label: "Agent Hub", icon: Bot },
];

function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-card">
      {/* Workspace switcher */}
      <button
        type="button"
        className="flex h-12 w-full items-center gap-3 px-3 text-left transition-colors hover:bg-secondary/60"
      >
        <Avatar className="size-6 rounded-[7px]">
          <AvatarFallback className="rounded-[7px] bg-amber-500 text-[14px] font-medium text-amber-100">
            C
          </AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-base font-semibold tracking-[-0.02em] text-foreground">
            Clubhouse.so
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </span>
      </button>

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
          <Route path="/customers/:customerId" element={<CustomerWorkspace />} />
          <Route path="/agents" element={<AgentHub />} />
        </Routes>
      </main>
    </div>
  );
}
