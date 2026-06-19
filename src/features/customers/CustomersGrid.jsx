import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  User,
  CircleDot,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { CUSTOMERS } from "@/data/customers";

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

const STATUS_STYLE = {
  Monitoring: { bg: "#eef0f2", fg: "#5b616b" },
  "Action needed": { bg: "#fdeaea", fg: "#d4351c" },
  Scheduled: { bg: "rgba(38,109,240,0.1)", fg: "rgb(38,109,240)" },
};

const STATUSES = Object.keys(STATUS_STYLE);

// Column model. `type` drives the inline editor; `sortValue` is the comparable.
const COLS = [
  { key: "task", label: "Task (AI Recommendations)", icon: User, width: 420, type: "text", sortValue: (c) => c.task },
  { key: "status", label: "Status", icon: CircleDot, width: 160, type: "select", options: STATUSES, sortValue: (c) => c.status },
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
      className="h-6 w-full rounded-[5px] border border-[rgb(38,109,240)] bg-white px-1.5 text-sm text-black outline-none"
    />
  );
}

const EDIT_CLASSES =
  "cursor-text rounded-[5px] outline outline-1 outline-transparent hover:outline-black/15";

export function CustomersGrid() {
  const [data, setData] = useState(CUSTOMERS);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [selected, setSelected] = useState(() => new Set());
  const [editing, setEditing] = useState(null); // { id, key }
  const nextId = useRef(1000);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.filter((c) =>
          [c.name, c.task, c.status]
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

  function addClient() {
    const id = nextId.current++;
    setData((prev) => [
      { id, name: "New client", task: "", avatar: "NC", accent: "#868e96", status: "Monitoring", email: "" },
      ...prev,
    ]);
    setEditing({ id, key: "task" });
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
            <span className="font-mono text-xs text-black/55">{selected.size} selected</span>
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
        <button
          type="button"
          onClick={addClient}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-[rgb(38,109,240)] px-2.5 text-sm font-medium text-white transition-colors hover:bg-[rgb(30,95,220)]"
        >
          <Plus className="size-3.5" /> New client
        </button>
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
                    Name
                    <SortIcon active={sort.key === "name"} dir={sort.dir} />
                  </button>
                  <button
                    type="button"
                    aria-label="New client"
                    onClick={addClient}
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
                      <Link
                        to={`/customers/${c.id}`}
                        state={{ customer: c }}
                        className="block min-w-0 flex-1 truncate rounded-[5px] font-medium outline outline-1 outline-transparent transition-colors hover:underline focus-visible:outline-[rgb(38,109,240)]"
                        style={{ color: INK }}
                      >
                        {c.name}
                      </Link>
                    </div>
                  </td>

                  {COLS.map((col) => {
                    const isEditing = editing && editing.id === c.id && editing.key === col.key;
                    return (
                      <td
                        key={col.key}
                        style={{ width: col.width, minWidth: col.width, borderColor: BORDER }}
                        className={`h-9 border-b border-r px-2 align-middle ${col.numeric ? "text-right" : ""} ${rowBg}`}
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
                        ) : isEditing ? (
                          <CellInput
                            value={c[col.key]}
                            onCommit={(v) => commitEdit(c.id, col.key, v)}
                            onCancel={() => setEditing(null)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing({ id: c.id, key: col.key })}
                            className={`block w-full truncate text-left ${EDIT_CLASSES}`}
                            style={{ color: INK }}
                          >
                            {c[col.key] || "—"}
                          </button>
                        )}
                      </td>
                    );
                  })}
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
