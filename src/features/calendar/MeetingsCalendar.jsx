import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarDays, List, Plus, Trash2, User, X } from "lucide-react";
import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";

// --- Local seed events (today = demo). Replace with backend data later. ---
const pad = (n) => String(n).padStart(2, "0");
const toLocalDateKey = (value = new Date()) => {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return "";
};
const todayISO = () => toLocalDateKey();

const seedEvents = () => {
  const d = todayISO();
  return [
    {
      id: "seed-1",
      title: "Greenleaf renewal review",
      start: `${d}T09:00`,
      end: `${d}T09:45`,
    },
    {
      id: "seed-2",
      title: "Northwind ROI walkthrough",
      start: `${d}T11:30`,
      end: `${d}T12:15`,
    },
    {
      id: "seed-3",
      title: "Quanta sponsor re-engagement",
      start: `${d}T14:00`,
      end: `${d}T14:30`,
    },
  ];
};

const uid = () => `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Build a combined ISO local string the calendar understands; "" time => all-day.
const toISO = (date, time) => (time ? `${date}T${time}` : date);
const toDateInputValue = (dt) =>
  dt ? `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` : todayISO();
const toTimeInputValue = (dt) => (dt ? `${pad(dt.getHours())}:${pad(dt.getMinutes())}` : "");

const emptyDraft = (date) => ({
  id: null,
  title: "",
  date: date || todayISO(),
  startTime: "09:00",
  endTime: "",
  customerId: "",
  notes: "",
  location: "",
});

export function MeetingsCalendar({ events: controlledEvents, onSaveEvent, onDeleteEvent, selectedEventId }) {
  const calendarRef = useRef(null);
  const selectedEventRef = useRef(null);
  const [localEvents, setLocalEvents] = useState(seedEvents);
  const [draft, setDraft] = useState(null); // null = modal closed
  const [viewMode, setViewMode] = useState("list"); // "calendar" | "list"
  const [calendarError, setCalendarError] = useState(null);
  const { data: fetchedCustomers } = useApi(() => api.getCustomers(), []);
  const events = controlledEvents ?? localEvents;
  const customers = fetchedCustomers ?? [];

  // List view shows only today's events.
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => toLocalDateKey(event?.start) === todayISO())
        .sort((a, b) => localTimestamp(a) - localTimestamp(b)),
    [events],
  );

  const customerNameById = useMemo(() => {
    const map = new Map();
    for (const customer of customers) map.set(String(customer.id), customer.name);
    return map;
  }, [customers]);

  const scheduledCount = upcomingEvents.length;

  // --- Open modal for a new event on the clicked date ---
  const handleDateClick = useCallback((info) => {
    setDraft(emptyDraft(info.dateStr.slice(0, 10)));
  }, []);

  // --- Open the editor from a stored event object (used by the list and query-link views) ---
  const editStored = useCallback((e) => {
    if (!e) return;
    setDraft({
      id: e.id,
      title: e.title,
      date: String(e.start ?? "").slice(0, 10) || todayISO(),
      startTime: e.allDay || !String(e.start ?? "").includes("T") ? "" : String(e.start).slice(11, 16),
      endTime: e.end && String(e.end).includes("T") ? String(e.end).slice(11, 16) : "",
      customerId: e.customerId ?? "",
      notes: e.notes ?? "",
      location: e.location ?? "",
    });
  }, []);

  // --- Open modal to edit an existing event ---
  const handleEventClick = useCallback(
    (info) => {
      const stored = events.find((e) => String(e.id) === String(info.event.id));
      if (stored) {
        editStored(stored);
        return;
      }

      const e = info.event;
      const start = e.start;
      const end = e.end;
      setDraft({
        id: e.id,
        title: e.title,
        date: toDateInputValue(start),
        startTime: e.allDay ? "" : toTimeInputValue(start),
        endTime: e.allDay ? "" : toTimeInputValue(end),
        customerId: "",
        notes: "",
        location: "",
      });
    },
    [editStored, events],
  );

  useEffect(() => {
    if (!selectedEventId || selectedEventRef.current === selectedEventId) return;
    const selectedEvent = events.find((event) => String(event.id) === String(selectedEventId));
    if (!selectedEvent) return;

    selectedEventRef.current = selectedEventId;
    setViewMode("calendar");
    calendarRef.current?.getApi?.().gotoDate(selectedEvent.start);
    editStored(selectedEvent);
  }, [editStored, events, selectedEventId]);

  const closeModal = () => setDraft(null);

  const saveDraft = async () => {
    if (!draft || !draft.title.trim()) return;
    const allDay = !draft.startTime;
    const next = {
      id: draft.id || uid(),
      title: draft.title.trim(),
      start: toISO(draft.date, draft.startTime),
      end: draft.endTime ? toISO(draft.date, draft.endTime) : undefined,
      allDay,
      customerId: draft.customerId || null,
      notes: draft.notes ?? "",
      location: draft.location ?? "",
    };
    try {
      setCalendarError(null);
      if (onSaveEvent) {
        await onSaveEvent(next);
      } else {
        setLocalEvents((prev) =>
          draft.id ? prev.map((e) => (e.id === draft.id ? next : e)) : [...prev, next],
        );
      }
      closeModal();
    } catch (error) {
      setCalendarError(error);
    }
  };

  const deleteDraft = async () => {
    if (!draft?.id) return;
    try {
      setCalendarError(null);
      if (onDeleteEvent) {
        await onDeleteEvent(draft.id);
      } else {
        setLocalEvents((prev) => prev.filter((e) => e.id !== draft.id));
      }
      closeModal();
    } catch (error) {
      setCalendarError(error);
    }
  };

  const headerToolbar = useMemo(
    () => ({ left: "title", center: "", right: "prev today next" }),
    [],
  );

  return (
    <section className="meetings-calendar rounded-[8px] border border-[#eeeeee] bg-white p-4">
      <div className="mb-3 flex flex-col items-start gap-2 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
        <h2 className="text-[14px] font-semibold leading-5 text-[#101112]">Today's events</h2>
        <div className="flex max-w-full flex-wrap items-center gap-2 min-[520px]:gap-3">
          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
          <span className="text-[12px] leading-4 text-[#7b7b7b]">
            {scheduledCount} scheduled
          </span>
          <button
            type="button"
            onClick={() => setDraft(emptyDraft())}
            className="flex h-7 items-center gap-1 rounded-[6px] bg-[#317cff] px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#2a6ce0]"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            New
          </button>
        </div>
      </div>
      {calendarError ? (
        <p className="mb-3 text-[12px] font-medium text-[#d4351c]">
          Could not sync the calendar change.
        </p>
      ) : null}

      {viewMode === "calendar" ? (
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={headerToolbar}
          buttonText={{ today: "Move to Today" }}
          height={560}
          fixedWeekCount={false}
          dayMaxEvents={3}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
          nowIndicator
        />
      ) : (
        <EventList events={upcomingEvents} customerNameById={customerNameById} onSelect={editStored} />
      )}

      {draft && (
        <EventModal
          draft={draft}
          setDraft={setDraft}
          customers={customers}
          onClose={closeModal}
          onSave={saveDraft}
          onDelete={deleteDraft}
        />
      )}
    </section>
  );
}

// --- Segmented control (Calendar / List) ---
function ViewSwitcher({ viewMode, setViewMode }) {
  const tabs = [
    { id: "list", label: "List", icon: List },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
  ];
  return (
    <div
      role="tablist"
      className="flex items-center gap-0.5 rounded-full bg-[#f1f1f3] p-0.5"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = viewMode === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            aria-label={label}
            onClick={() => setViewMode(id)}
            className={`flex h-7 items-center gap-1.5 rounded-full px-2 text-[13px] font-medium transition-colors min-[520px]:px-3 ${
              active
                ? "bg-white text-[#101112] shadow-sm"
                : "bg-transparent text-[#7b7b7b] hover:text-[#4a4a4a]"
            }`}
          >
            <Icon className="size-3.5" strokeWidth={1.9} />
            <span className="hidden min-[520px]:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

const fmtTime = (iso) => {
  if (!iso.includes("T")) return null;
  const [h, min] = iso.slice(11, 16).split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(min).padStart(2, "0")} ${ampm}`;
};

const localTimestamp = (event) => {
  const start = String(event?.start ?? "");
  const [year, month, day] = start.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return Number.POSITIVE_INFINITY;
  if (!start.includes("T")) return new Date(year, month - 1, day).getTime();
  const [hour = 0, minute = 0] = start.slice(11, 16).split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
};

const getNextUpId = (events) => {
  const now = Date.now();
  return events.find((event) => localTimestamp(event) >= now)?.id ?? events[0]?.id ?? null;
};

// Left-column date parts + a relative label (Today / Tomorrow) for the agenda.
const fmtDateParts = (iso) => {
  const key = String(iso ?? "").slice(0, 10);
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return { day: "--", month: "", weekday: "", relative: "" };
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  return {
    day: String(day),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    relative: key === todayKey ? "Today" : key === tomorrowKey ? "Tomorrow" : "",
  };
};

// --- List view: upcoming meetings as agenda rows. Left = date; right = title,
// description and client. ---
function EventList({ events, customerNameById, onSelect }) {
  if (events.length === 0) {
    return (
      <div className="flex max-h-[560px] flex-col items-center justify-center gap-1 py-12 text-center">
        <p className="text-[13px] font-medium text-[#6b6b70]">No upcoming meetings</p>
        <p className="text-[12px] text-[#a3a3a3]">Add one with “New”, or switch to Calendar.</p>
      </div>
    );
  }
  const nextUpId = getNextUpId(events);

  return (
    <ul className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
      {events.map((e) => {
        const time = e.allDay ? null : fmtTime(e.start);
        const date = fmtDateParts(e.start);
        const isNextUp = String(e.id) === String(nextUpId);
        const client = e.customerId ? customerNameById?.get(String(e.customerId)) : "";
        const description = e.notes?.trim() || e.location?.trim() || "";
        return (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onSelect(e)}
              className="flex w-full items-stretch gap-3 rounded-[12px] border border-[#ededed] bg-white p-3 text-left transition-all hover:border-[#d6d6d6] hover:shadow-[0_1px_2px_rgba(16,17,18,0.04),0_8px_20px_rgba(16,17,18,0.05)]"
            >
              {/* Date — left */}
              <div className="flex w-[60px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#f6f7f9] py-2 text-center">
                <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-[#8a8a8f]">
                  {date.month}
                </span>
                <span className="mt-1 text-[20px] font-semibold leading-none text-[#101112]">
                  {date.day}
                </span>
                <span className="mt-1 text-[10px] font-medium leading-none text-[#a3a3a3]">
                  {date.relative || date.weekday}
                </span>
              </div>

              {/* Title + description + client — right */}
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-[14px] font-semibold leading-5 text-[#101112]">
                    {e.title}
                  </p>
                  {isNextUp ? (
                    <span className="shrink-0 rounded-full border border-[#bfd7ff] bg-[#eaf3ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#1f63d3]">
                      Next up
                    </span>
                  ) : null}
                </div>
                {description ? (
                  <p className="line-clamp-2 text-[12px] leading-4 text-[#7b7b7b]">{description}</p>
                ) : null}
                <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-[#9a9aa0]">
                  <span>{time || "All day"}</span>
                  {client ? (
                    <>
                      <span className="text-[#d6d6d6]">·</span>
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <User className="size-3 shrink-0" strokeWidth={1.9} />
                        <span className="min-w-0 truncate text-[#5a5a60]">{client}</span>
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function EventModal({ draft, setDraft, customers = [], onClose, onSave, onDelete }) {
  const isEditing = Boolean(draft.id);
  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-[#101112]">
            {isEditing ? "Edit event" : "New event"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full bg-[#f8f8f7] text-[#1a1a1a] transition-colors hover:bg-[#eeeeec]"
          >
            <X className="size-4" strokeWidth={1.9} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-[#7b7b7b]">Title</span>
            <input
              autoFocus
              type="text"
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && onSave()}
              placeholder="Meeting title"
              className="w-full rounded-[6px] border border-[#e6e6e9] px-2.5 py-1.5 text-[14px] text-[#101112] outline-none focus:border-[#317cff]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-[#7b7b7b]">Client</span>
            <select
              value={draft.customerId ?? ""}
              onChange={(e) => update({ customerId: e.target.value })}
              className="w-full rounded-[6px] border border-[#e6e6e9] bg-white px-2.5 py-1.5 text-[14px] text-[#101112] outline-none focus:border-[#317cff]"
            >
              <option value="">No client</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-[#7b7b7b]">Date</span>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => update({ date: e.target.value })}
              className="w-full rounded-[6px] border border-[#e6e6e9] px-2.5 py-1.5 text-[14px] text-[#101112] outline-none focus:border-[#317cff]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-[#7b7b7b]">Start</span>
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => update({ startTime: e.target.value })}
                className="w-full rounded-[6px] border border-[#e6e6e9] px-2.5 py-1.5 text-[14px] text-[#101112] outline-none focus:border-[#317cff]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-[#7b7b7b]">End</span>
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => update({ endTime: e.target.value })}
                className="w-full rounded-[6px] border border-[#e6e6e9] px-2.5 py-1.5 text-[14px] text-[#101112] outline-none focus:border-[#317cff]"
              />
            </label>
          </div>
          <p className="text-[11px] leading-4 text-[#a3a3a3]">
            Leave Start empty for an all-day event.
          </p>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-[#7b7b7b]">Location</span>
            <input
              type="text"
              value={draft.location}
              onChange={(e) => update({ location: e.target.value })}
              placeholder="Optional - call link or address"
              className="w-full rounded-[6px] border border-[#e6e6e9] px-2.5 py-1.5 text-[14px] text-[#101112] outline-none focus:border-[#317cff]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-[#7b7b7b]">Notes</span>
            <textarea
              value={draft.notes}
              onChange={(e) => update({ notes: e.target.value })}
              rows={2}
              placeholder="Optional"
              className="w-full resize-none rounded-[6px] border border-[#e6e6e9] px-2.5 py-1.5 text-[14px] text-[#101112] outline-none focus:border-[#317cff]"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {isEditing ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[13px] font-medium text-[#ef4444] transition-colors hover:bg-[#fef2f2]"
            >
              <Trash2 className="size-3.5" strokeWidth={1.9} />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-[6px] border border-[#e6e6e9] px-3 text-[13px] font-medium text-[#4a4a4a] transition-colors hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!draft.title.trim()}
              className="h-8 rounded-[6px] bg-[#317cff] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#2a6ce0] disabled:opacity-50"
            >
              {isEditing ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
