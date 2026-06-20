import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Chat } from "@/pages/Chat";
import { CustomerHub } from "@/pages/CustomerHub";
import { CustomerWorkspace } from "@/pages/CustomerWorkspace";
import { AgentHub } from "@/pages/AgentHub";
import { McpPage } from "@/pages/McpPage";
import { Workflows } from "@/pages/Workflows";
import { api } from "@/services/dataClient";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown,
  Database,
  House,
  Keyboard,
  PanelLeft,
  Search,
  Users,
  X,
} from "lucide-react";

const primaryNav = [
  { to: "/home", label: "Home", icon: House, end: true },
  { to: "/customers", label: "Customer Hub", icon: Users },
];

const sections = [
  {
    label: "Client Memory",
    items: [
      { to: "/customers", label: "Client records", icon: Database },
    ],
  },
];

const quickActions = [
  { to: "/home", label: "Open home", description: "Review today and follow-ups", icon: House },
  { to: "/customers", label: "Open customer hub", description: "Find and manage client records", icon: Users },
];

const SIDEBAR_OPEN_KEY = "client-os-sidebar-open";
const CUSTOMER_CHAT_UPDATED_EVENT = "client-os-customer-chat-updated";

function SidebarLink({
  to,
  label,
  description,
  icon: Icon,
  avatar,
  avatarUrl,
  accent,
  end,
  inset = false,
  showActive = true,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "group flex min-w-0 items-center gap-1.5 rounded-[9px] px-2 text-[14px] font-medium leading-5 tracking-[-0.01em] text-[#101112] transition-colors",
          description ? "min-h-10 py-1" : "h-7",
          inset ? "ml-5 w-[212px]" : "w-[232px]",
          showActive && isActive ? "bg-black/[0.04]" : "hover:bg-black/[0.035]"
        )
      }
      title={description ? `${label} · ${description}` : label}
    >
      {avatar || avatarUrl ? (
        <Avatar className="size-6 rounded-full">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback
            className="rounded-full text-[9px] font-semibold leading-none text-white"
            style={{ backgroundColor: accent }}
          >
            {avatar}
          </AvatarFallback>
        </Avatar>
      ) : Icon ? (
        <Icon className="size-3.5 shrink-0 text-[#5f6368]" strokeWidth={1.9} />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {description ? (
          <span className="block truncate text-[11px] font-medium leading-4 tracking-normal text-black/45">
            {description}
          </span>
        ) : null}
      </span>
    </NavLink>
  );
}

function QuickActionsDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");

  const filteredActions = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return quickActions;
    }

    return quickActions.filter((action) =>
      `${action.label} ${action.description}`.toLowerCase().includes(term)
    );
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function runAction(action) {
    navigate(action.to);
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-[18vh] z-50 flex w-[min(560px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-[#e6e7ea] bg-white shadow-[0_18px_60px_rgba(28,40,64,0.22)]">
          <Dialog.Title className="sr-only">Quick actions</Dialog.Title>
          <div className="flex h-12 items-center gap-2 border-b border-[#ececef] px-3">
            <Search className="size-4 shrink-0 text-black/45" strokeWidth={1.9} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actions"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[#101112] outline-none placeholder:text-black/35"
            />
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-black/55 transition-colors hover:bg-black/[0.05]"
                aria-label="Close quick actions"
              >
                <X className="size-4" strokeWidth={1.9} />
              </button>
            </Dialog.Close>
          </div>
          <div className="max-h-[360px] overflow-y-auto p-1.5">
            {filteredActions.length ? (
              filteredActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.to}
                    type="button"
                    onClick={() => runAction(action)}
                    className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-black/[0.04] focus-visible:bg-black/[0.04] focus-visible:outline-none"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-black/[0.035] text-black/60">
                      <Icon className="size-4" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold leading-5 text-[#101112]">
                        {action.label}
                      </span>
                      <span className="block truncate text-[12px] font-medium leading-4 text-black/45">
                        {action.description}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex h-20 items-center justify-center px-4 text-[13px] font-medium text-black/45">
                No actions found
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SidebarSection({ label, items, emptyText }) {
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
        {items.length ? (
          items.map((item) => (
            <SidebarLink
              key={`${label}-${item.to}-${item.label}`}
              {...item}
              inset
              showActive={item.showActive ?? false}
            />
          ))
        ) : (
          <div className="ml-5 w-[212px] px-2 py-1.5 text-[12px] font-medium leading-4 text-black/40">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({ onCollapse }) {
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [recentCustomerChats, setRecentCustomerChats] = useState([]);
  const [recentChatsLoading, setRecentChatsLoading] = useState(true);
  const recentChatItems = useMemo(
    () =>
      recentCustomerChats.map((chat) => ({
        to: `/customers/${chat.customerId}`,
        label: chat.customerName,
        description: chat.summary,
        avatar: chat.avatar,
        avatarUrl: chat.avatarUrl,
        accent: chat.accent,
        showActive: true,
      })),
    [recentCustomerChats]
  );

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuickActionsOpen((open) => !open);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadRecentCustomerChats() {
      setRecentChatsLoading(true);
      try {
        const threads = await api.getRecentCustomerChatThreads();
        if (alive) setRecentCustomerChats(threads);
      } catch {
        if (alive) setRecentCustomerChats([]);
      } finally {
        if (alive) setRecentChatsLoading(false);
      }
    }

    function onStorage(event) {
      if (event.key === "client-os-customer-memories-v1") loadRecentCustomerChats();
    }

    loadRecentCustomerChats();
    window.addEventListener(CUSTOMER_CHAT_UPDATED_EVENT, loadRecentCustomerChats);
    window.addEventListener("storage", onStorage);

    return () => {
      alive = false;
      window.removeEventListener(CUSTOMER_CHAT_UPDATED_EVENT, loadRecentCustomerChats);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <aside className="flex h-screen w-[248px] shrink-0 flex-col border-r border-[#e6e7ea] bg-white text-[#101112]">
      <div className="flex h-[49px] w-full shrink-0 items-center gap-2 border-b border-[#e6e7ea] px-3 text-left">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-black/[0.025]"
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
        </button>
        <button
          type="button"
          onClick={onCollapse}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-black/60 transition-colors hover:bg-black/[0.05] hover:text-[#101112] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <PanelLeft className="size-4 shrink-0" strokeWidth={1.7} />
        </button>
      </div>

      <div className="flex h-11 w-[247px] items-center px-2.5 pb-2.5 pt-2">
        <button
          type="button"
          onClick={() => setQuickActionsOpen(true)}
          className="flex h-7 w-full items-center gap-1.5 rounded-[5px] bg-white px-1.5 text-left text-[14px] font-medium leading-5 tracking-[-0.01em] text-[#101112] shadow-[0_0_0_1px_rgba(28,40,64,0.08),0_2px_8px_rgba(28,40,64,0.10)]"
          aria-haspopup="dialog"
          aria-expanded={quickActionsOpen}
        >
          <Keyboard className="size-3.5 shrink-0 text-black/60" strokeWidth={1.8} />
          <span className="min-w-0 flex-1 truncate">Quick actions</span>
          <kbd className="flex h-5 shrink-0 items-center justify-center rounded-md px-1 text-[11px] leading-none tracking-[0.02em] text-black/50 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            ⌘K
          </kbd>
        </button>
      </div>
      <QuickActionsDialog open={quickActionsOpen} onOpenChange={setQuickActionsOpen} />

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
          <SidebarSection
            label="Chat"
            items={recentChatItems}
            emptyText={recentChatsLoading ? "Loading AI chats..." : "No AI customer chats yet"}
          />
        </div>
      </nav>
    </aside>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SIDEBAR_OPEN_KEY) !== "false";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen ? (
        <Sidebar onCollapse={() => setSidebarOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-40 flex size-9 items-center justify-center rounded-lg border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <PanelLeft className="size-4" strokeWidth={1.8} />
        </button>
      )}
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
