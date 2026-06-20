import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Chat } from "@/pages/Chat";
import { CustomerHub } from "@/pages/CustomerHub";
import { CustomerWorkspace } from "@/pages/CustomerWorkspace";
import { AgentHub } from "@/pages/AgentHub";
import { McpPage } from "@/pages/McpPage";
import { Workflows } from "@/pages/Workflows";
import { dataMode } from "@/services/dataClient";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bot,
  CalendarDays,
  ChevronDown,
  Database,
  House,
  Keyboard,
  MessageCircle,
  PanelLeft,
  Plug,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

const primaryNav = [
  { to: "/home", label: "Home", icon: House, end: true },
  { to: "/customers", label: "Customer Hub", icon: Users },
  { to: "/agents", label: "Agent Hub", icon: Bot },
  { to: "/workflows", label: "Workflows", icon: Workflow },
  { to: "/mcp", label: "Connectors", icon: Plug },
];

const sections = [
  {
    label: "Client Memory",
    items: [
      { to: "/customers", label: "Client records", icon: Database },
      { to: "/chat", label: "Advisor companion", icon: MessageCircle, end: true },
    ],
  },
  {
    label: "Automations",
    items: [
      { to: "/workflows", label: "Follow-up workflows", icon: Workflow },
      { to: "/agents", label: "Agent presets", icon: Sparkles },
    ],
  },
  {
    label: "Chat",
    items: [
      { to: "/mcp", label: "Knowledge connectors", icon: Plug },
      { to: "/customers", label: "Weekly client view", icon: CalendarDays },
    ],
  },
];

function SidebarLink({ to, label, icon: Icon, end, inset = false, showActive = true }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "group flex h-7 min-w-0 items-center gap-1.5 rounded-[9px] px-2 text-[14px] font-medium leading-5 tracking-[-0.01em] text-[#101112] transition-colors",
          inset ? "ml-5 w-[212px]" : "w-[232px]",
          showActive && isActive ? "bg-black/[0.04]" : "hover:bg-black/[0.035]"
        )
      }
      title={label}
    >
      <Icon className="size-3.5 shrink-0 text-[#5f6368]" strokeWidth={1.9} />
      <span className="min-w-0 truncate">{label}</span>
    </NavLink>
  );
}

function SidebarSection({ label, items }) {
  return (
    <div className="flex w-[247px] flex-col gap-0.5">
      <button
        type="button"
        className="mx-2 flex h-7 w-[232px] items-center gap-1.5 rounded-md px-2 text-left text-[12px] font-medium leading-4 tracking-[-0.01em] text-black/60 transition-colors hover:bg-black/[0.035]"
      >
        <ChevronDown className="size-3.5 shrink-0" strokeWidth={1.8} />
        <span className="min-w-0 truncate">{label}</span>
      </button>
      <div className="relative flex flex-col gap-px px-2 pb-0.5">
        <div className="absolute left-[27px] top-0 h-full w-px bg-[#d9dade]/60" />
        {items.map((item) => (
          <SidebarLink key={`${label}-${item.label}`} {...item} inset showActive={false} />
        ))}
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="flex h-screen w-[248px] shrink-0 flex-col border-r border-[#e6e7ea] bg-white text-[#101112]">
      <button
        type="button"
        className="flex h-12 w-full items-center gap-2 border-b border-[#e6e7ea] px-4 text-left transition-colors hover:bg-black/[0.025]"
      >
        <Avatar className="size-6 shrink-0 rounded-md">
          <AvatarFallback className="rounded-md bg-[#e9a62a] text-[13px] font-semibold text-white">
            C
          </AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-[14px] font-semibold leading-5 tracking-[-0.01em]">
            Client OS
          </span>
          <ChevronDown className="size-3 shrink-0 text-[#101112]" strokeWidth={1.9} />
        </span>
        <PanelLeft className="size-4 shrink-0 text-black/60" strokeWidth={1.7} />
      </button>

      <div className="flex h-11 w-[247px] items-center px-2.5 pb-2.5 pt-2">
        <button
          type="button"
          className="flex h-7 w-full items-center gap-1.5 rounded-[5px] bg-white px-1.5 text-left text-[14px] font-medium leading-5 tracking-[-0.01em] text-[#101112] shadow-[0_0_0_1px_rgba(28,40,64,0.08),0_2px_8px_rgba(28,40,64,0.10)]"
        >
          <Keyboard className="size-3.5 shrink-0 text-black/60" strokeWidth={1.8} />
          <span className="min-w-0 flex-1 truncate">Quick actions</span>
          <kbd className="flex h-5 shrink-0 items-center justify-center rounded-md px-1 text-[11px] leading-none tracking-[0.02em] text-black/50 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="flex w-[247px] flex-col gap-px px-2">
          {primaryNav.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {sections.map((section) => (
            <SidebarSection key={section.label} {...section} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/customers" element={<CustomerHub />} />
          <Route path="/customers/:customerId" element={<CustomerWorkspace />} />
          <Route path="/agents" element={<AgentHub />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/mcp" element={<McpPage />} />
        </Routes>
      </main>
    </div>
  );
}
