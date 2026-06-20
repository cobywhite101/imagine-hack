import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Chat } from "@/pages/Chat";
import { CustomerHub } from "@/pages/CustomerHub";
import { CustomerWorkspace } from "@/pages/CustomerWorkspace";
import { Expenses } from "@/pages/Expenses";
import { AgentHub } from "@/pages/AgentHub";
import { McpPage } from "@/pages/McpPage";
import { Workflows } from "@/pages/Workflows";
import { api } from "@/services/dataClient";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import aetherLogo from "@/assets/Aether-logo.png";
import {
  ChevronDown,
  Database,
  House,
  PanelLeft,
  Search,
  Users,
  WalletCards,
} from "lucide-react";

const primaryNav = [
  { to: "/home", label: "Home", icon: House, end: true },
  { to: "/customers", label: "My Clients", icon: Users },
  { to: "/expenses", label: "My Expenses", icon: WalletCards },
];





const SIDEBAR_OPEN_KEY = "client-os-sidebar-open";
const CUSTOMER_CHAT_UPDATED_EVENT = "client-os-customer-chat-updated";
const SIDEBAR_ANIMATION_MS = 200;
const CUSTOMER_ACCENTS = ["#3bd4cb", "#317cff", "#e64980", "#4991e5", "#9b69ff", "#7048e8", "#22b8cf", "#2f9e44"];

function getInitials(name) {
  const initials = String(name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "CL";
}

function getCustomerAccent(seed) {
  let hash = 0;
  const key = String(seed ?? "");

  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  return CUSTOMER_ACCENTS[hash % CUSTOMER_ACCENTS.length];
}

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
        <span
          className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-[5px] text-[10px] font-semibold leading-none text-white"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        >
          {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : avatar}
        </span>
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



function SidebarSection({ label, items, emptyText, onSearch, searchValue }) {
  const [expanded, setExpanded] = useState(true);
  const contentId = useId();

  return (
    <div className="flex w-[247px] flex-col gap-0.5 px-1">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="w-full flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-[12px] font-medium leading-4 tracking-[-0.01em] text-black/60 transition-colors hover:bg-black/[0.035]"
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none",
            expanded ? "rotate-0" : "-rotate-90"
          )}
          strokeWidth={1.8}
        />
        <span className="min-w-0 truncate">{label}</span>
      </button>
      <div
        id={contentId}
        className={cn("relative flex-col gap-px px-2 pb-0.5", expanded ? "flex" : "hidden")}
      >
        <div className="absolute left-[27px] top-0 h-full w-px bg-[#d9dade]/60" />
        {onSearch && (
          <div className="relative z-10 ml-5 mr-2 mb-1.5 mt-0.5 flex h-6 items-center gap-1.5 rounded-md border border-[#e6e7ea] bg-white px-1.5 focus-within:border-[#317cff] focus-within:ring-1 focus-within:ring-[#317cff]">
            <Search className="size-3 text-black/40" />
            <input
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search chats"
              className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-black/40"
            />
          </div>
        )}
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

function Sidebar({ open, onCollapse }) {
  const [recentCustomerChats, setRecentCustomerChats] = useState([]);
  const [recentChatsLoading, setRecentChatsLoading] = useState(true);
  const [chatSearch, setChatSearch] = useState("");

  const recentChatItems = useMemo(() => {
    let items = recentCustomerChats.map((chat) => {
      const desc = String(chat.summary || "").toLowerCase();
      const shouldClearDesc =
        desc.includes("thank you") ||
        desc.includes("trusting") ||
        desc.includes("aiman hakim") ||
        desc.includes("summarize");

      return {
        to: `/customers/${chat.customerId}`,
        label: chat.customerName,
        description: shouldClearDesc ? "" : chat.summary,
        avatar: chat.avatar || getInitials(chat.customerName),
        avatarUrl: chat.avatarUrl,
        accent: chat.accent || getCustomerAccent(chat.customerId || chat.customerName),
        showActive: true,
      };
    });

    if (chatSearch.trim()) {
      const query = chatSearch.toLowerCase();
      items = items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
    }
    return items;
  }, [recentCustomerChats, chatSearch]);



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
    <aside
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "flex h-screen w-[248px] shrink-0 flex-col border-r border-[#e6e7ea] bg-white text-[#101112] transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
        open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
      )}
    >
      <div className="flex h-[49px] w-full shrink-0 items-center gap-2 border-b border-[#e6e7ea] px-3 text-left">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1">
          <Avatar className="size-6 shrink-0 rounded-[6px]">
            <AvatarImage
              src={aetherLogo}
              alt="Aether logo"
              className="rounded-[6px] object-contain"
            />
            <AvatarFallback className="rounded-[6px] bg-[#e9a62a] text-[13px] font-semibold text-white">
              A
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold leading-5 tracking-[-0.01em]">
              Aether
            </span>
          </span>
        </div>
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



      <nav className="min-h-0 flex w-[247px] flex-1 flex-col">
        <div className="h-0 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <div className="flex w-full flex-col gap-px">
            {primaryNav.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </div>
          <div className="mt-3 -ml-2 flex flex-col gap-3">
            <SidebarSection
              label="Chat"
              items={recentChatItems}
              emptyText={recentChatsLoading ? "Loading AI chats..." : "No AI customer chats yet"}
              onSearch={setChatSearch}
              searchValue={chatSearch}
            />
          </div>
        </div>
        <div className="mt-auto border-t border-[#e6e7ea] bg-white px-2 py-3">
          <div className="mx-0.5 flex items-center gap-2 rounded-md p-1.5">
            <Avatar className="size-8 shrink-0 rounded-md">
              <AvatarImage src="" alt="Ferdinand profile picture" />
              <AvatarFallback className="rounded-md bg-[#e9a62a] text-[13px] font-semibold text-white">
                F
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-5 tracking-[-0.01em]">
                Ferdinand
              </span>
              <span className="block truncate text-[11px] font-medium leading-4 text-black/55">
                ferdinandnat@gmail.com
              </span>
            </span>
          </div>
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
  const [showExpandButton, setShowExpandButton] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_OPEN_KEY) === "false";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      setShowExpandButton(false);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setShowExpandButton(true);
    }, SIDEBAR_ANIMATION_MS);

    return () => window.clearTimeout(timeout);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <div
        className={cn(
          "relative h-screen shrink-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none",
          sidebarOpen ? "w-[248px]" : "w-0"
        )}
      >
        <Sidebar open={sidebarOpen} onCollapse={() => setSidebarOpen(false)} />
      </div>
      {showExpandButton ? (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-40 flex size-9 items-center justify-center rounded-lg border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <PanelLeft className="size-4" strokeWidth={1.8} />
        </button>
      ) : null}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/customers" element={<CustomerHub />} />
          <Route path="/customers/:customerId" element={<CustomerWorkspace />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/agents" element={<AgentHub />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/mcp" element={<McpPage />} />
        </Routes>
      </main>
    </div>
  );
}
