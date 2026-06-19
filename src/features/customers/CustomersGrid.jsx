import { useMemo, useState } from "react";
import {
  Plus,
  User,
  CircleDot,
  Layers,
  Hash,
  DollarSign,
  Clock,
  Mail,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/**
 * Functional CRM grid styled as a faithful replica of Attio's spreadsheet view.
 *
 * Uses Attio's light palette and pixel metrics on purpose (rgb(238,239,241)
 * borders, rgb(16,17,18) ink, rgb(38,109,240) links, rgba(155,105,255,0.04)
 * row hover) rather than the app's dark tokens — the goal is visual accuracy
 * to the source design. Data is fake/in-memory customers.
 */

const BORDER = "rgb(238, 239, 241)";
const INK = "rgb(16, 17, 18)";
const LINK = "rgb(38, 109, 240)";

// Fake customers — in-memory only.
const CUSTOMERS = [
  { id: 1, name: "Greenleaf", avatar: "GL", accent: "#3bd4cb", contact: "Maya Chen", role: "VP Sales", status: "Negotiation", tier: "Enterprise", seats: 52, arr: 148000, lastTouch: "2d ago", email: "maya@greenleaf.io" },
  { id: 2, name: "Northwind Labs", avatar: "NL", accent: "#317cff", contact: "Dev Okafor", role: "Head of RevOps", status: "Proposal", tier: "Mid-market", seats: 24, arr: 61000, lastTouch: "5d ago", email: "dev@northwind.dev" },
  { id: 3, name: "Atlas Freight", avatar: "AF", accent: "#ec5d40", contact: "Priya Nair", role: "COO", status: "Qualified", tier: "Enterprise", seats: 80, arr: 210000, lastTouch: "1d ago", email: "priya@atlasfreight.com" },
  { id: 4, name: "Sunrise Retail", avatar: "SR", accent: "#4991e5", contact: "Tom Becker", role: "Director", status: "Won", tier: "Mid-market", seats: 18, arr: 44000, lastTouch: "Today", email: "tom@sunriseretail.co" },
  { id: 5, name: "Quanta Health", avatar: "QH", accent: "#9b69ff", contact: "Lena Fischer", role: "CTO", status: "Churn-risk", tier: "Enterprise", seats: 64, arr: 172000, lastTouch: "12d ago", email: "lena@quantahealth.com" },
  { id: 6, name: "Beacon Studios", avatar: "BS", accent: "#f5a524", contact: "Ray Mwangi", role: "Founder", status: "Lead", tier: "Startup", seats: 9, arr: 12000, lastTouch: "3d ago", email: "ray@beacon.studio" },
  { id: 7, name: "Corewave", avatar: "CW", accent: "#22b8cf", contact: "Iris Tanaka", role: "VP Ops", status: "Qualified", tier: "Mid-market", seats: 31, arr: 78000, lastTouch: "6d ago", email: "iris@corewave.ai" },
  { id: 8, name: "Pinecrest Bank", avatar: "PB", accent: "#2f9e44", contact: "Marcus Hale", role: "Head of IT", status: "Negotiation", tier: "Enterprise", seats: 120, arr: 320000, lastTouch: "Today", email: "marcus@pinecrest.bank" },
  { id: 9, name: "Lumen Media", avatar: "LM", accent: "#e64980", contact: "Sofia Ruiz", role: "CMO", status: "Proposal", tier: "Mid-market", seats: 27, arr: 66000, lastTouch: "4d ago", email: "sofia@lumen.media" },
  { id: 10, name: "Vertex Robotics", avatar: "VR", accent: "#7048e8", contact: "Aiden Park", role: "VP Eng", status: "Won", tier: "Enterprise", seats: 95, arr: 245000, lastTouch: "1d ago", email: "aiden@vertexrobotics.com" },
  { id: 11, name: "Maple & Co", avatar: "MC", accent: "#fd7e14", contact: "Grace Liu", role: "Owner", status: "Lead", tier: "Startup", seats: 6, arr: 9000, lastTouch: "8d ago", email: "grace@mapleandco.com" },
  { id: 12, name: "Driftwood Travel", avatar: "DT", accent: "#15aabf", contact: "Noah Schmidt", role: "Head of Sales", status: "Churn-risk", tier: "Mid-market", seats: 22, arr: 53000, lastTouch: "15d ago", email: "noah@driftwood.travel" },
  { id: 13, name: "Halcyon AI", avatar: "HA", accent: "#4263eb", contact: "Yuki Sato", role: "CEO", status: "Qualified", tier: "Startup", seats: 14, arr: 28000, lastTouch: "2d ago", email: "yuki@halcyon.ai" },
  { id: 14, name: "Granite Legal", avatar: "GL", accent: "#868e96", contact: "Omar Haddad", role: "Partner", status: "Negotiation", tier: "Enterprise", seats: 48, arr: 134000, lastTouch: "Today", email: "omar@granitelegal.com" },
];

const STATUS_STYLE = {
  Lead: { bg: "#eef0f2", fg: "#5b616b" },
  Qualified: { bg: "rgba(38,109,240,0.1)", fg: "rgb(38,109,240)" },
  Proposal: { bg: "#fff3e0", fg: "#b25e09" },
  Negotiation: { bg: "rgba(155,105,255,0.12)", fg: "#7c4dff" },
  Won: { bg: "#e7f6ec", fg: "#1a7f43" },
  "Churn-risk": { bg: "#fdeaea", fg: "#d4351c" },
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const nf = new Intl.NumberFormat("en-US");

// Column model. `sortValue` returns the comparable value for a row.
const COLS = [
  { key: "contact", label: "Contact", icon: User, width: 220, sortValue: (c) => c.contact },
  { key: "status", label: "Status", icon: CircleDot, width: 160, sortValue: (c) => c.status },
  { key: "tier", label: "Tier", icon: Layers, width: 150, sortValue: (c) => c.tier },
  { key: "seats", label: "Seats", icon: Hash, width: 120, numeric: true, sortValue: (c) => c.seats },
  { key: "arr", label: "ARR", icon: DollarSign, width: 140, numeric: true, sortValue: (c) => c.arr },
  { key: "lastTouch", label: "Last touch", icon: Clock, width: 150, sortValue: (c) => c.id },
  { key: "email", label: "Email", icon: Mail, width: 220, link: true, sortValue: (c) => c.email },
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

export function CustomersGrid() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [selected, setSelected] = useState(() => new Set());

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? CUSTOMERS.filter((c) =>
          [c.name, c.contact, c.role, c.status, c.tier, c.email]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : CUSTOMERS;

    const col = sort.key === "name" ? NAME_COL : COLS.find((c) => c.key === sort.key);
    const sorted = [...filtered].sort((a, b) => {
      const av = col.sortValue(a);
      const bv = col.sortValue(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [query, sort]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
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
            placeholder="Search customers, contacts, status…"
            className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/40"
          />
        </div>
        {selected.size > 0 && (
          <span className="font-mono text-xs text-black/55">{selected.size} selected</span>
        )}
      </div>

      {/* Grid */}
      <div
        className="min-h-0 flex-1 overflow-auto rounded-lg border bg-white"
        style={{ borderColor: BORDER, color: INK, fontSize: 14 }}
      >
        <table className="border-collapse" style={{ tableLayout: "fixed" }}>
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
                    Customer
                    <SortIcon active={sort.key === "name"} dir={sort.dir} />
                  </button>
                  <button
                    type="button"
                    aria-label="New customer"
                    className="ml-auto flex size-7 items-center justify-center rounded-lg text-black/55 transition-colors hover:bg-black/5"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </th>

              {COLS.map((c) => {
                const Icon = c.icon;
                const active = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    style={{ width: c.width, minWidth: c.width, borderColor: BORDER }}
                    className="h-10 border-b border-r bg-white px-3 align-middle font-medium"
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
            {rows.map((c) => {
              const isSel = selected.has(c.id);
              const rowBg = isSel ? "bg-[rgba(38,109,240,0.06)]" : "bg-white group-hover/r:bg-[rgba(155,105,255,0.04)]";
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
                      <span className="truncate font-medium" style={{ color: INK }}>
                        {c.name}
                      </span>
                    </div>
                  </td>

                  {COLS.map((col) => (
                    <td
                      key={col.key}
                      style={{ width: col.width, minWidth: col.width, borderColor: BORDER }}
                      className={`h-9 border-b border-r px-3 align-middle ${col.numeric ? "text-right" : ""} ${rowBg}`}
                    >
                      {col.key === "status" ? (
                        <StatusPill status={c.status} />
                      ) : col.key === "contact" ? (
                        <span className="block truncate" style={{ color: INK }}>
                          <span className="font-medium">{c.contact}</span>
                          <span className="text-black/45"> · {c.role}</span>
                        </span>
                      ) : col.link ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="block truncate hover:underline"
                          style={{ color: LINK }}
                        >
                          {c.email}
                        </a>
                      ) : col.numeric ? (
                        <span className="block truncate font-medium" style={{ color: INK }}>
                          {col.key === "arr" ? usd.format(c.arr) : nf.format(c[col.key])}
                        </span>
                      ) : (
                        <span className="block truncate font-medium" style={{ color: INK }}>
                          {c[col.key]}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* Footer / count row */}
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
              {COLS.map((c) => (
                <td
                  key={c.key}
                  style={{ width: c.width, minWidth: c.width, borderColor: BORDER }}
                  className="group/calc h-9 border-r bg-white px-3"
                >
                  <span className="flex items-center gap-1.5 text-black/30 transition-colors group-hover/calc:text-black/55">
                    <Plus className="size-3.5" /> Add calculation
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Lead;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}
