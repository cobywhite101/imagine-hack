import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "react-router-dom";
import {
  Plus,
  User,
  CircleDot,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
  X,
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

// Column model. `type` drives the inline editor; `sortValue` is the comparable.
const COLS = [
  { key: "task", label: "Task (AI Recommendations)", icon: User, width: 360, type: "text", sortValue: (c) => c.task },
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

const EDIT_CLASSES =
  "cursor-text rounded-[5px] outline outline-1 outline-transparent hover:outline-black/15";

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

function getCellValue(row, col) {
  const value = row[col.key];
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value ?? "";
}

function normalizeCustomer(customer) {
  const name = customer.name ?? customer.company ?? "Unnamed customer";
  const rawStatus = customer.status;
  const status = STATUS_STYLE[rawStatus]
    ? rawStatus
    : DEAL_STATUS_TO_GRID_STATUS[rawStatus] ?? (customer.overdue ? "Action needed" : "Monitoring");

  return {
    ...customer,
    name,
    task: customer.task ?? customer.nextAction ?? customer.next_action ?? "",
    avatar: customer.avatar ?? getInitials(name),
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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [selected, setSelected] = useState(() => new Set());
  const [editing, setEditing] = useState(null); // { id, key }
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClient, setNewClient] = useState(EMPTY_CLIENT);
  const nextId = useRef(1000);

  useEffect(() => {
    if (customers) setData(customers.map(normalizeCustomer));
  }, [customers]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.filter((c) =>
          [c.name, c.task, c.status, ...COLS.map((col) => getCellValue(c, col)), ...(c.tags ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : data;

    const col = sort.key === "name" ? NAME_COL : COLS.find((c) => c.key === sort.key);
    const sorted = [...filtered].sort((a, b) => {
      const av = col.sortValue(a);
      const bv = col.sortValue(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [data, query, sort]);

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

  function deleteSelected() {
    setData((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
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
      <div className="flex items-center gap-3" style={{ color: INK }}>
        <div
          className="flex h-8 flex-1 items-center gap-2 rounded-lg border bg-white px-2.5"
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
        {selected.size > 0 && (
          <>
            <span className="text-xs text-black/55">{selected.size} selected</span>
            <button
              type="button"
              onClick={deleteSelected}
              className="flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium text-[#d4351c] transition-colors hover:bg-[#fdeaea]"
              style={{ borderColor: BORDER }}
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </>
        )}
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

      {/* Grid */}
      <div
        className="min-h-0 flex-1 overflow-auto rounded-lg border bg-white"
            style={{ borderColor: BORDER, color: INK, fontSize: 14 }}
          >
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <thead className="sticky top-0 z-30">
            <tr>
              {/* Customer header — sticky left */}
              <th
                style={{ width: 260, minWidth: 260, borderColor: BORDER }}
                className="sticky left-0 z-40 h-10 border-b border-r bg-white px-3 text-left align-middle"
              >
                <div className="flex items-center gap-2" style={{ color: INK }}>
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 font-medium hover:text-black"
                  >
                    Name
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

              {COLS.map((c, index) => {
                const Icon = c.icon;
                const active = sort.key === c.key;
                const isLast = index === COLS.length - 1;
                return (
                  <th
                    key={c.key}
                    style={{ width: c.width, minWidth: c.width, borderColor: BORDER }}
                    className={`h-10 border-b bg-white px-3 align-middle font-medium ${isLast ? "" : "border-r"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={`group/h flex w-full items-center gap-1.5 ${c.numeric ? "justify-end" : ""}`}
                      style={{ color: active ? INK : "rgba(0,0,0,0.63)" }}
                    >
                      <Icon className="size-3.5 shrink-0" strokeWidth={2} />
                      <span className="truncate">{c.label}</span>
                      <SortIcon active={active} dir={sort.dir} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 9 }).map((_, index) => (
                <CustomerGridSkeletonRow key={index} index={index} />
              ))}

            {!loading && error && (
              <tr>
                <td
                  colSpan={COLS.length + 1}
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
              return (
                <tr key={c.id} className="group/r cursor-default">
                  {/* Customer — sticky */}
                  <td
                    style={{ width: 260, minWidth: 260, borderColor: BORDER }}
                    className={`sticky left-0 z-20 h-9 border-b border-r px-3 ${rowBg}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isSel ? "" : "opacity-0 transition-opacity group-hover/r:opacity-100"}>
                        <Checkbox checked={isSel} onChange={() => toggleRow(c.id)} />
                      </span>
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold text-white"
                        style={{ backgroundColor: c.accent }}
                      >
                        {c.avatar}
                      </span>
                      <Link
                        to={`/customers/${c.id}`}
                        className="block min-w-0 flex-1 truncate rounded-[5px] font-medium outline outline-1 outline-transparent transition-colors hover:underline focus-visible:outline-[rgb(38,109,240)]"
                        style={{ color: INK }}
                      >
                        {c.name}
                      </Link>
                    </div>
                  </td>

                  {COLS.map((col, index) => {
                    const isEditing = editing && editing.id === c.id && editing.key === col.key;
                    const isLast = index === COLS.length - 1;
                    return (
                      <td
                        key={col.key}
                        style={{ width: col.width, minWidth: col.width, borderColor: BORDER }}
                        className={`h-9 border-b px-2 align-middle ${col.numeric ? "text-right" : ""} ${rowBg} ${isLast ? "" : "border-r"}`}
                      >
                        {col.type === "select" ? (
                          isEditing ? (
                            <select
                              autoFocus
                              defaultValue={c[col.key]}
                              onChange={(e) => commitEdit(c.id, col.key, e.target.value)}
                              onBlur={() => setEditing(null)}
                              className="h-6 w-full rounded-[5px] border border-[rgb(38,109,240)] bg-white px-1 text-sm text-black outline-none"
                            >
                              {col.options.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditing({ id: c.id, key: col.key })}
                              className={`block text-left ${EDIT_CLASSES}`}
                            >
                              <StatusPill status={c.status} />
                            </button>
                          )
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
                  style={{ width: 260, minWidth: 260, borderColor: BORDER }}
                  className="sticky left-0 z-20 h-9 border-r bg-white px-3 text-right"
                >
                  <span className="font-medium" style={{ color: INK }}>
                    {rows.length}
                  </span>{" "}
                  count
                </td>
                {COLS.map((c, index) => {
                  const isLast = index === COLS.length - 1;
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

function CustomerGridSkeletonRow({ index }) {
  const widths = ["74%", "58%", "68%", "52%"];

  return (
    <tr>
      <td
        style={{ width: 260, minWidth: 260, borderColor: BORDER }}
        className="sticky left-0 z-20 h-9 border-b border-r bg-white px-3"
      >
        <div className="flex items-center gap-2.5">
          <SkeletonBlock width={16} height={16} />
          <SkeletonBlock width={20} height={20} />
          <SkeletonBlock width={widths[index % widths.length]} height={16} />
        </div>
      </td>
      {COLS.map((col, colIndex) => {
        const isLast = colIndex === COLS.length - 1;
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

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Monitoring;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {status}
    </span>
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
