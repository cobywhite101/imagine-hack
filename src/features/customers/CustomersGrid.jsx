import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "react-router-dom";
import {
  Plus,
  User,
  Camera,
  CircleDot,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
  X,
  Rows3,
  Columns3,
  BriefcaseBusiness,
  CalendarDays,
  FileCheck2,
  FileText,
  Landmark,
  MessageSquare,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";
import { SkeletonBlock } from "@/components/ui/skeleton";

/**
 * Functional CRM grid for client records.
 *
 * Keeps a compact spreadsheet-like surface so advisors can scan and update
 * next actions without leaving the client hub.
 */

const BORDER = "rgb(238, 239, 241)";
const INK = "rgb(16, 17, 18)";

const STATUS_STYLE = {
  Monitoring: { bg: "#eef0f2", fg: "#5b616b" },
  "Action needed": { bg: "#fdeaea", fg: "#d4351c" },
  Scheduled: { bg: "rgba(38,109,240,0.1)", fg: "rgb(38,109,240)" },
};

const STATUSES = Object.keys(STATUS_STYLE);
const DEAL_STATUS_TO_GRID_STATUS = {
  Lead: "Monitoring",
  Qualified: "Scheduled",
  Proposal: "Scheduled",
  Negotiation: "Action needed",
  Won: "Monitoring",
  "Churn-risk": "Action needed",
};
const ACCENTS = ["#3bd4cb", "#317cff", "#e64980", "#4991e5", "#9b69ff", "#7048e8", "#22b8cf", "#2f9e44"];
const FALLBACK_ACCENT = "#868e96";
const EMPTY_CLIENT = { name: "", email: "", task: "", status: "Monitoring" };
const EMPTY_COLUMN = { label: "", key: "" };

const PROFILE_MIME_PREFIX = "image/";
const PROFILE_MAX_SIZE_MB = 3;

// Column model. `type` drives the inline editor; `sortValue` is the comparable.
const DEFAULT_COLS = [
  { key: "task", label: "Task", icon: User, width: 360, type: "text", sortValue: (c) => c.task },
  { key: "status", label: "Status", icon: CircleDot, width: 160, type: "select", options: STATUSES, sortValue: (c) => c.status },
  { key: "occupation", label: "Occupation", icon: BriefcaseBusiness, width: 190, type: "text", sortValue: (c) => c.occupation },
  { key: "annualIncomeBracket", label: "Income", icon: Landmark, width: 140, type: "text", sortValue: (c) => c.annualIncomeBracket },
  { key: "netWorthBracket", label: "Net worth", icon: Landmark, width: 150, type: "text", sortValue: (c) => c.netWorthBracket },
  { key: "riskTolerance", label: "Risk", icon: ShieldCheck, width: 135, type: "text", sortValue: (c) => c.riskTolerance },
  {
    key: "policySummary",
    label: "Policies",
    icon: FileText,
    width: 260,
    type: "text",
    editable: false,
    sortValue: (c) => c.policyCount ?? 0,
  },
  {
    key: "nextRenewal",
    label: "Next renewal",
    icon: CalendarDays,
    width: 140,
    type: "text",
    sortValue: (c) => c.nextRenewal,
  },
  {
    key: "estatePlanStatus",
    label: "Estate plan",
    icon: HeartHandshake,
    width: 145,
    type: "text",
    sortValue: (c) => c.estatePlanStatus,
  },
  {
    key: "preferredCommunicationChannel",
    label: "Channel",
    icon: MessageSquare,
    width: 130,
    type: "text",
    sortValue: (c) => c.preferredCommunicationChannel,
  },
  { key: "kycStatus", label: "KYC", icon: FileCheck2, width: 120, type: "text", sortValue: (c) => c.kycStatus },
];

const NAME_COL_WIDTH = 260;

const NAME_COL = { key: "name", sortValue: (c) => c.name };

function Checkbox({ checked, indeterminate, onChange, className = "" }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
        checked || indeterminate
          ? "border-[rgb(38,109,240)] bg-[rgb(38,109,240)] text-white"
          : "border-black/25 bg-white hover:border-black/45"
      } ${className}`}
    >
      {indeterminate ? (
        <span className="h-0.5 w-2 rounded bg-white" />
      ) : checked ? (
        <svg viewBox="0 0 16 16" fill="none" className="size-3">
          <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  );
}

function SortIcon({ active, dir }) {
  if (!active) return null;
  return dir === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />;
}

// Inline text editor. Commits on blur or Enter, cancels on Escape.
function CellInput({ value, onCommit, onCancel }) {
  const [v, setV] = useState(value ?? "");
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => onCommit(v)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(v);
        else if (e.key === "Escape") onCancel();
      }}
      className="w-full text-sm outline-none border-none focus:outline-none focus:ring-0"
      style={{
        color: INK,
        background: "transparent",
        padding: 0,
        border: "none",
        boxShadow: "none",
        outline: "none",
      }}
    />
  );
}

function getInitials(name) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "NC";
}

function getCustomerAccent(customer) {
  if (customer.accent && customer.accent !== FALLBACK_ACCENT) return customer.accent;
  const key = String(customer.id ?? customer.name ?? customer.company ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return ACCENTS[hash % ACCENTS.length];
}

function isImageValue(value) {
  return /^(https?:|data:image\/|blob:)/i.test(String(value ?? "").trim()) || String(value ?? "").startsWith("/");
}

function asDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getCellValue(row, col) {
  const value = row[col.key];
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value ?? "";
}

function slugifyColumnKey(label, columns) {
  const base =
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "column";
  const existing = new Set(["name", ...columns.map((col) => col.key)]);
  let key = base;
  let index = 2;

  while (existing.has(key)) {
    key = `${base}_${index}`;
    index += 1;
  }

  return key;
}

function normalizeCustomer(customer) {
  const name = customer.name ?? customer.company ?? "Unnamed customer";
  const rawStatus = customer.status;
  const status = STATUS_STYLE[rawStatus]
    ? rawStatus
    : DEAL_STATUS_TO_GRID_STATUS[rawStatus] ?? (customer.overdue ? "Action needed" : "Monitoring");

  const avatarUrl =
    customer.avatarUrl ??
    customer.avatar_url ??
    customer.profileImageUrl ??
    customer.profile_image_url ??
    customer.profilePictureUrl ??
    customer.profile_picture_url ??
    customer.photoUrl ??
    customer.photo_url ??
    customer.imageUrl ??
    customer.image_url ??
    (isImageValue(customer.avatar) ? customer.avatar : "");

  return {
    ...customer,
    name,
    task: customer.task ?? customer.nextAction ?? customer.next_action ?? "",
    avatar: customer.avatar ?? getInitials(name),
    avatarUrl,
    accent: getCustomerAccent(customer),
    status,
    email: customer.email ?? customer.contact ?? "",
    occupation: customer.occupation ?? "",
    annualIncomeBracket: customer.annualIncomeBracket ?? customer.annual_income_bracket ?? "",
    netWorthBracket: customer.netWorthBracket ?? customer.net_worth_bracket ?? "",
    riskTolerance: customer.riskTolerance ?? customer.risk_tolerance ?? "",
    policyCount: customer.policyCount ?? customer.policy_count ?? customer.policies?.length ?? 0,
    policySummary:
      customer.policySummary ??
      customer.policy_summary ??
      (customer.policies?.length ? `${customer.policies.length} policies` : ""),
    nextRenewal: customer.nextRenewal ?? customer.next_renewal ?? "",
    estatePlanStatus: customer.estatePlanStatus ?? customer.estate_plan_status ?? "",
    preferredCommunicationChannel:
      customer.preferredCommunicationChannel ?? customer.preferred_communication_channel ?? "",
    kycStatus: customer.kycStatus ?? customer.kyc_status ?? "",
  };
}

export function CustomersGrid() {
  const { data: customers, loading, error } = useApi(() => api.getCustomers());
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState(DEFAULT_COLS);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [selected, setSelected] = useState(() => new Set());
  const [editing, setEditing] = useState(null); // { id, key }
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClient, setNewClient] = useState(EMPTY_CLIENT);
  const [newColumnOpen, setNewColumnOpen] = useState(false);
  const [newColumn, setNewColumn] = useState(EMPTY_COLUMN);
  const [uploadingAvatar, setUploadingAvatar] = useState(new Set());
  const nextId = useRef(1000);

  const gridMinWidth = useMemo(
    () => NAME_COL_WIDTH + columns.reduce((total, col) => total + col.width, 0),
    [columns]
  );

  useEffect(() => {
    if (customers) setData(customers.map(normalizeCustomer));
  }, [customers]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.filter((c) =>
          [c.name, c.task, c.status, ...columns.map((col) => getCellValue(c, col)), ...(c.tags ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : data;

    const col = sort.key === "name" ? NAME_COL : columns.find((c) => c.key === sort.key);
    const sorted = [...filtered].sort((a, b) => {
      const av = col?.sortValue(a) ?? "";
      const bv = col?.sortValue(b) ?? "";
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [columns, data, query, sort]);

  async function uploadAvatar(id, file) {
    if (!file) return;

    if (!file.type.startsWith(PROFILE_MIME_PREFIX)) {
      return;
    }

    if (file.size > PROFILE_MAX_SIZE_MB * 1024 * 1024) {
      return;
    }

    setUploadingAvatar((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const avatarUrl = await asDataURL(file);

      setData((prev) =>
        prev.map((row) => (row.id === id ? { ...row, avatarUrl } : row))
      );

      const updated = await api.updateCustomerRecord(id, { avatarUrl });
      if (updated) {
        setData((prev) =>
          prev.map((row) =>
            row.id === id
              ? {
                  ...row,
                  avatarUrl: updated.avatarUrl ?? row.avatarUrl,
                }
              : row
          )
        );
      }
    } finally {
      setUploadingAvatar((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function handleAvatarChange(id, event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    uploadAvatar(id, file);
  }

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function commitEdit(id, key, value) {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
    setEditing(null);
  }

  function openNewClientModal() {
    setNewClient(EMPTY_CLIENT);
    setNewClientOpen(true);
  }

  function updateNewClient(key, value) {
    setNewClient((prev) => ({ ...prev, [key]: value }));
  }

  function addClient(e) {
    e.preventDefault();
    const name = newClient.name.trim();
    if (!name) return;

    const id = nextId.current++;
    const task = newClient.task.trim();
    setData((prev) => [
      {
        id,
        name,
        task,
        avatar: getInitials(name),
        avatarUrl: "",
        accent: ACCENTS[id % ACCENTS.length],
        status: newClient.status,
        email: newClient.email.trim(),
      },
      ...prev,
    ]);
    setEditing(task ? null : { id, key: "task" });
    setNewClient(EMPTY_CLIENT);
    setNewClientOpen(false);
  }

  function addBlankRow() {
    const id = nextId.current++;
    const name = `New client ${id - 999}`;
    setData((prev) => [
      {
        id,
        name,
        task: "",
        avatar: getInitials(name),
        avatarUrl: "",
        accent: ACCENTS[id % ACCENTS.length],
        status: "Monitoring",
        email: "",
      },
      ...prev,
    ]);
    setEditing({ id, key: "task" });
  }

  function deleteRow(id) {
    setData((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function deleteSelected() {
    setData((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
  }

  function openNewColumnModal() {
    setNewColumn(EMPTY_COLUMN);
    setNewColumnOpen(true);
  }

  function updateNewColumn(key, value) {
    setNewColumn((prev) => ({ ...prev, [key]: value }));
  }

  function addColumn(e) {
    e.preventDefault();
    const label = newColumn.label.trim();
    if (!label) return;

    const key = newColumn.key.trim() || slugifyColumnKey(label, columns);
    if (key === "name" || columns.some((col) => col.key === key)) return;

    const column = {
      key,
      label,
      icon: Columns3,
      width: Math.max(140, Math.min(260, label.length * 12 + 92)),
      type: "text",
      sortValue: (c) => c[key] ?? "",
    };

    setColumns((prev) => [...prev, column]);
    setData((prev) => prev.map((row) => ({ ...row, [key]: "" })));
    setNewColumn(EMPTY_COLUMN);
    setNewColumnOpen(false);
  }

  function removeColumn(key) {
    setColumns((prev) => prev.filter((col) => col.key !== key));
    setData((prev) =>
      prev.map((row) => {
        const { [key]: _removed, ...rest } = row;
        return rest;
      })
    );
    setEditing((cell) => (cell?.key === key ? null : cell));
    setSort((current) => (current.key === key ? { key: "name", dir: "asc" } : current));
  }

  function toggleRow(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const visibleIds = rows.map((r) => r.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = visibleIds.some((id) => selected.has(id)) && !allSelected;

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3" style={{ color: INK }}>
        <div
          className="flex h-8 w-full max-w-[360px] items-center gap-2 rounded-lg border bg-white px-2.5 sm:w-[320px]"
          style={{ borderColor: BORDER }}
        >
          <Search className="size-3.5 text-black/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, task, status…"
            className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/40"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          {selected.size > 0 && <span className="text-xs text-black/55">{selected.size} selected</span>}
          {selected.size > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              className="flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium text-[#d4351c] transition-colors hover:bg-[#fdeaea]"
              style={{ borderColor: BORDER }}
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          )}
          <button
            type="button"
            onClick={addBlankRow}
            className="flex h-8 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
            style={{ borderColor: BORDER }}
          >
            <Rows3 className="size-3.5" /> Add row
          </button>
          <NewColumnDialog
            column={newColumn}
            open={newColumnOpen}
            onOpenChange={setNewColumnOpen}
            onChange={updateNewColumn}
            onSubmit={addColumn}
            existingKeys={new Set(["name", ...columns.map((col) => col.key)])}
            trigger={
              <button
                type="button"
                onClick={openNewColumnModal}
                className="flex h-8 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
                style={{ borderColor: BORDER }}
              >
                <Columns3 className="size-3.5" /> Add column
              </button>
            }
          />
          <NewClientDialog
            client={newClient}
            open={newClientOpen}
            onOpenChange={setNewClientOpen}
            onChange={updateNewClient}
            onSubmit={addClient}
            trigger={
              <button
                type="button"
                onClick={openNewClientModal}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[rgb(38,109,240)] px-2.5 text-sm font-medium text-white transition-colors hover:bg-[rgb(30,95,220)]"
              >
                <Plus className="size-3.5" /> New client
              </button>
            }
          />
        </div>
      </div>

      {/* Grid */}
      <div
        className="min-h-0 flex-1 overflow-auto rounded-lg border bg-white"
        style={{ borderColor: BORDER, color: INK, fontSize: 14 }}
      >
        <table
          className="border-separate border-spacing-0"
          style={{ tableLayout: "fixed", width: gridMinWidth, minWidth: gridMinWidth }}
        >
          <colgroup>
            <col style={{ width: NAME_COL_WIDTH }} />
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-30">
            <tr>
              {/* Customer header — sticky left */}
              <th
                style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, borderColor: BORDER }}
                className="sticky left-0 z-40 h-10 overflow-hidden border-b border-r bg-white px-3 text-left align-middle"
              >
                <div className="flex min-w-0 items-center gap-2" style={{ color: INK }}>
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="flex min-w-0 items-center gap-1 font-medium hover:text-black"
                  >
                    <span className="truncate">Name</span>
                    <SortIcon active={sort.key === "name"} dir={sort.dir} />
                  </button>
                  <button
                    type="button"
                    aria-label="New client"
                    onClick={openNewClientModal}
                    className="ml-auto flex size-7 items-center justify-center rounded-lg text-black/55 transition-colors hover:bg-black/5"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </th>

              {columns.map((c, index) => {
                const Icon = c.icon;
                const active = sort.key === c.key;
                const isLast = index === columns.length - 1;
                return (
                  <th
                    key={c.key}
                    style={{ width: c.width, minWidth: c.width, borderColor: BORDER }}
                    className={`h-10 overflow-hidden border-b bg-white px-3 align-middle font-medium ${isLast ? "" : "border-r"}`}
                  >
                    <div className="group/col flex min-w-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={`group/h flex min-w-0 flex-1 items-center gap-1.5 ${c.numeric ? "justify-end" : ""}`}
                        style={{ color: active ? INK : "rgba(0,0,0,0.63)" }}
                      >
                        <Icon className="size-3.5 shrink-0" strokeWidth={2} />
                        <span className="truncate">{c.label}</span>
                        <SortIcon active={active} dir={sort.dir} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${c.label} column`}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeColumn(c.key);
                        }}
                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-black/35 opacity-0 transition-colors hover:bg-[#fdeaea] hover:text-[#d4351c] group-hover/col:opacity-100 focus-visible:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 9 }).map((_, index) => (
                <CustomerGridSkeletonRow key={index} index={index} columns={columns} />
              ))}

            {!loading && error && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="h-24 px-3 text-center text-sm text-[#d4351c]"
                  style={{ borderColor: BORDER }}
                >
                  Could not load customers from Supabase.
                </td>
              </tr>
            )}

            {rows.map((c) => {
              const isSel = selected.has(c.id);
              const rowBg = isSel ? "bg-[rgba(38,109,240,0.06)]" : "bg-white group-hover/r:bg-[rgba(38,109,240,0.04)]";
              const stickyRowBg = isSel ? "bg-[#f2f6fe]" : "bg-white group-hover/r:bg-[#f6f9fe]";
              return (
                <tr key={c.id} className="group/r cursor-default">
                  {/* Customer — sticky */}
                  <td
                    style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, borderColor: BORDER }}
                    className={`sticky left-0 z-20 h-9 overflow-hidden border-b border-r px-3 ${stickyRowBg}`}
                  >
                    <div className="flex min-w-0 max-w-full items-center gap-2.5 overflow-hidden">
                      <span className={`shrink-0 ${isSel ? "" : "opacity-0 transition-opacity group-hover/r:opacity-100"}`}>
                        <Checkbox checked={isSel} onChange={() => toggleRow(c.id)} />
                      </span>
                      <span
                        className="relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-[5px] text-[10px] font-semibold text-white"
                        style={{ backgroundColor: c.accent }}
                      >
                        {c.avatarUrl ? <img src={c.avatarUrl} alt={`${c.name} avatar`} className="size-full object-cover" /> : c.avatar}
                        <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/45 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
                          <Camera className="size-3 text-white" />
                          <span className="sr-only">Upload profile picture</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAvatarChange(c.id, e)}
                            className="hidden"
                          />
                        </label>
                      </span>
                      {uploadingAvatar.has(c.id) && (
                        <span className="font-medium text-[11px] tracking-wide text-black/55">Uploading…</span>
                      )}
                      <Link
                        to={`/customers/${c.id}`}
                        className="block min-w-0 flex-1 truncate rounded-[5px] font-medium outline outline-1 outline-transparent transition-colors hover:underline focus-visible:outline-[rgb(38,109,240)]"
                        style={{ color: INK }}
                      >
                        {c.name}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Remove ${c.name}`}
                        onClick={() => deleteRow(c.id)}
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-black/30 opacity-0 transition-colors hover:bg-[#fdeaea] hover:text-[#d4351c] group-hover/r:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>

                  {columns.map((col, index) => {
                    const isEditing = editing && editing.id === c.id && editing.key === col.key;
                    const isLast = index === columns.length - 1;
                    return (
                      <td
                        key={col.key}
                        style={{ width: col.width, minWidth: col.width, borderColor: BORDER }}
                        className={`h-9 overflow-hidden border-b px-2 align-middle ${col.numeric ? "text-right" : ""} ${rowBg} ${isLast ? "" : "border-r"}`}
                      >
                        {col.type === "select" ? (
                          <StatusSelect
                            status={c[col.key]}
                            options={col.options}
                            onChange={(value) => commitEdit(c.id, col.key, value)}
                          />
                        ) : isEditing && col.editable !== false ? (
                          <CellInput
                            value={c[col.key]}
                            onCommit={(v) => commitEdit(c.id, col.key, v)}
                            onCancel={() => setEditing(null)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (col.editable !== false) setEditing({ id: c.id, key: col.key });
                            }}
                            className={`block w-full truncate text-left outline-none ${col.editable === false ? "cursor-default" : "cursor-text"}`}
                            style={{ color: INK }}
                          >
                            {getCellValue(c, col) || "—"}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {!loading && (
              <tr style={{ color: "rgba(0,0,0,0.55)" }}>
                <td
                  style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, borderColor: BORDER }}
                  className="sticky left-0 z-20 h-9 overflow-hidden border-r bg-white px-3 text-right"
                >
                  <span className="font-medium" style={{ color: INK }}>
                    {rows.length}
                  </span>{" "}
                  count
                </td>
                {columns.map((c, index) => {
                  const isLast = index === columns.length - 1;
                  return (
                    <td
                      key={c.key}
                      style={{ width: c.width, minWidth: c.width, borderColor: BORDER }}
                      className={`h-9 bg-white px-3 ${isLast ? "" : "border-r"}`}
                    />
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerGridSkeletonRow({ index, columns }) {
  const widths = ["74%", "58%", "68%", "52%"];

  return (
    <tr>
      <td
        style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, borderColor: BORDER }}
        className="sticky left-0 z-20 h-9 overflow-hidden border-b border-r bg-white px-3"
      >
        <div className="flex min-w-0 max-w-full items-center gap-2.5 overflow-hidden">
          <SkeletonBlock width={16} height={16} />
          <SkeletonBlock width={20} height={20} />
          <SkeletonBlock width={widths[index % widths.length]} height={16} />
        </div>
      </td>
      {columns.map((col, colIndex) => {
        const isLast = colIndex === columns.length - 1;
        const width = col.key === "status" ? 96 : widths[(index + colIndex) % widths.length];

        return (
          <td
            key={col.key}
            style={{ width: col.width, minWidth: col.width, borderColor: BORDER }}
            className={`h-9 border-b bg-white px-2 align-middle ${isLast ? "" : "border-r"}`}
          >
            <SkeletonBlock height={col.key === "status" ? 22 : 15} width={width} />
          </td>
        );
      })}
    </tr>
  );
}

function StatusSelect({ status, options, onChange }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Monitoring;
  return (
    <label className="relative inline-flex max-w-full items-center">
      <select
        aria-label="Mark status"
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 max-w-full appearance-none rounded-md border border-transparent py-0.5 pl-2 pr-6 text-xs font-medium outline-none transition-colors hover:border-black/15 focus:border-[rgb(38,109,240)]"
        style={{ backgroundColor: s.bg, color: s.fg }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 size-3" style={{ color: s.fg }} />
    </label>
  );
}

function NewColumnDialog({ column, open, onOpenChange, onChange, onSubmit, trigger, existingKeys }) {
  const trimmedLabel = column.label.trim();
  const trimmedKey = column.key.trim();
  const keyTaken = trimmedKey.length > 0 && existingKeys.has(trimmedKey);
  const canSubmit = trimmedLabel.length > 0 && !keyTaken;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-0 text-[rgb(16,17,18)] shadow-2xl outline-none"
          style={{ borderColor: BORDER }}
        >
          <form onSubmit={onSubmit}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: BORDER }}>
              <div>
                <Dialog.Title className="text-base font-semibold">Add column</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-black/55">
                  Create an editable text field for every client row.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-black/45 transition-colors hover:bg-black/5 hover:text-black/70"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="grid gap-4 px-5 py-5">
              <label className="grid gap-1.5 text-sm font-medium">
                Column name
                <input
                  autoFocus
                  value={column.label}
                  onChange={(e) => onChange("label", e.target.value)}
                  placeholder="Renewal owner"
                  className="h-9 rounded-lg border bg-white px-3 text-sm font-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-[rgb(38,109,240)]"
                  style={{ borderColor: BORDER }}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Field key
                <input
                  value={column.key}
                  onChange={(e) => onChange("key", e.target.value.trim().replace(/[^A-Za-z0-9_]/g, ""))}
                  placeholder="Optional, auto-generated"
                  className="h-9 rounded-lg border bg-white px-3 font-mono text-sm font-normal text-black outline-none transition-colors placeholder:font-sans placeholder:text-black/35 focus:border-[rgb(38,109,240)]"
                  style={{ borderColor: keyTaken ? "#d4351c" : BORDER }}
                />
                {keyTaken && <span className="text-xs font-normal text-[#d4351c]">That key is already in use.</span>}
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t px-5 py-4" style={{ borderColor: BORDER }}>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-8 rounded-lg border bg-white px-3 text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
                  style={{ borderColor: BORDER }}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!canSubmit}
                className="h-8 rounded-lg bg-[rgb(38,109,240)] px-3 text-sm font-medium text-white transition-colors hover:bg-[rgb(30,95,220)] disabled:cursor-not-allowed disabled:bg-black/20"
              >
                Add column
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NewClientDialog({ client, open, onOpenChange, onChange, onSubmit, trigger }) {
  const canSubmit = client.name.trim().length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-0 text-[rgb(16,17,18)] shadow-2xl outline-none"
          style={{ borderColor: BORDER }}
        >
          <form onSubmit={onSubmit}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: BORDER }}>
              <div>
                <Dialog.Title className="text-base font-semibold">New client</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-black/55">
                  Add a client to the customer workspace.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-black/45 transition-colors hover:bg-black/5 hover:text-black/70"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="grid gap-4 px-5 py-5">
              <label className="grid gap-1.5 text-sm font-medium">
                Name
                <input
                  autoFocus
                  value={client.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  placeholder="Maya Chen"
                  className="h-9 rounded-lg border bg-white px-3 text-sm font-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-[rgb(38,109,240)]"
                  style={{ borderColor: BORDER }}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Email
                <input
                  type="email"
                  value={client.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  placeholder="maya.chen@example.com"
                  className="h-9 rounded-lg border bg-white px-3 text-sm font-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-[rgb(38,109,240)]"
                  style={{ borderColor: BORDER }}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Status
                <select
                  value={client.status}
                  onChange={(e) => onChange("status", e.target.value)}
                  className="h-9 rounded-lg border bg-white px-3 text-sm font-normal text-black outline-none transition-colors focus:border-[rgb(38,109,240)]"
                  style={{ borderColor: BORDER }}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Task
                <textarea
                  value={client.task}
                  onChange={(e) => onChange("task", e.target.value)}
                  placeholder="Prepare annual policy check-in notes"
                  rows={3}
                  className="min-h-20 resize-none rounded-lg border bg-white px-3 py-2 text-sm font-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-[rgb(38,109,240)]"
                  style={{ borderColor: BORDER }}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t px-5 py-4" style={{ borderColor: BORDER }}>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-8 rounded-lg border bg-white px-3 text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
                  style={{ borderColor: BORDER }}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!canSubmit}
                className="h-8 rounded-lg bg-[rgb(38,109,240)] px-3 text-sm font-medium text-white transition-colors hover:bg-[rgb(30,95,220)] disabled:cursor-not-allowed disabled:bg-black/20"
              >
                Create client
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
