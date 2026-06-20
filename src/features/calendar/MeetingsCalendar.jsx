import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarDays, List, Plus, Trash2, X } from "lucide-react";
import { api } from "@/services/dataClient";

const todayISO = () => new Date().toISOString().slice(0, 10);

// Build a combined ISO local string the calendar understands; "" time => all-day.
const toISO = (date, time) => (time ? `${date}T${time}` : date);

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

export function MeetingsCalendar() {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [draft, setDraft] = useState(null); // null = modal closed
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "list"

  // Load meetings + customer options from the shared data layer. Both calls
  // resolve in Supabase mode and in the mock/localStorage fallback mode.
  useEffect(() => {
    let active = true;
    api
      .getAdvisorMeetings()
      .then((data) => active && setEvents(data))
      .catch(() => {});
    api
      .getCustomers()
      .then((data) => active && setCustomers(data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const scheduledCount = events.length;

  // Events sorted by date ascending, for the list view.
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0)),
    [events],
  );

  // --- Open modal for a new event on the clicked date ---
  const handleDateClick = useCallback((info) => {
    setDraft(emptyDraft(info.dateStr.slice(0, 10)));
  }, []);

  // --- Open the editor from a stored meeting object (list + calendar views) ---
  const editStored = useCallback((e) => {
    setDraft({
      id: e.id,
      title: e.title,
      date: e.start.slice(0, 10),
      startTime: e.allDay || !e.start.includes("T") ? "" : e.start.slice(11, 16),
      endTime: e.end && e.end.includes("T") ? e.end.slice(11, 16) : "",
      customerId: e.customerId ?? "",
      notes: e.notes ?? "",
      location: e.location ?? "",
    });
  }, []);

  // --- Open modal to edit an existing event (look up the full stored record so
  // customerId/notes/location survive the round-trip) ---
  const handleEventClick = useCallback(
    (info) => {
      const stored = events.find((e) => String(e.id) === String(info.event.id));
      if (stored) editStored(stored);
    },
    [events, editStored],
  );

  const closeModal = () => setDraft(null);

  const saveDraft = async () => {
    if (!draft || !draft.title.trim()) return;
    const allDay = !draft.startTime;
    const payload = {
      id: draft.id || undefined,
      customerId: draft.customerId || null,
      title: draft.title.trim(),
      start: toISO(draft.date, draft.startTime),
      end: draft.endTime ? toISO(draft.date, draft.endTime) : undefined,
      allDay,
      notes: draft.notes ?? "",
      location: draft.location ?? "",
    };
    const saved = await api.saveAdvisorMeeting(payload);
    setEvents((prev) => {
      const exists = prev.some((e) => String(e.id) === String(saved.id));
      return exists
        ? prev.map((e) => (String(e.id) === String(saved.id) ? saved : e))
        : [...prev, saved];
    });
    closeModal();
  };

  const deleteDraft = async () => {
    if (!draft?.id) return;
    await api.deleteAdvisorMeeting(draft.id);
    setEvents((prev) => prev.filter((e) => String(e.id) !== String(draft.id)));
    closeModal();
  };

  const headerToolbar = useMemo(
    () => ({ left: "title", center: "", right: "prev today next" }),
    [],
  );

  return (
    <section className="meetings-calendar rounded-[8px] border border-[#eeeeee] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-medium leading-5 text-[#4a4a4a]">Today's meetings</h2>
        <div className="flex items-center gap-3">
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

      {viewMode === "calendar" ? (
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={headerToolbar}
          buttonText={{ today: "Today" }}
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
        <EventList events={sortedEvents} onSelect={editStored} />
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
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "list", label: "List", icon: List },
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
            onClick={() => setViewMode(id)}
            className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors ${
              active
                ? "bg-white text-[#101112] shadow-sm"
                : "bg-transparent text-[#7b7b7b] hover:text-[#4a4a4a]"
            }`}
          >
            <Icon className="size-3.5" strokeWidth={1.9} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// --- Date / time formatting for the list view ---
const fmtDate = (iso) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const fmtTime = (iso) => {
  if (!iso.includes("T")) return null;
  const [h, min] = iso.slice(11, 16).split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(min).padStart(2, "0")} ${ampm}`;
};

// --- List view: same events, sorted ascending, as row cards ---
function EventList({ events, onSelect }) {
  if (events.length === 0) {
    return (
      <div className="flex h-[560px] items-center justify-center text-[13px] text-[#a3a3a3]">
        No events yet — switch to Calendar and click a date to add one.
      </div>
    );
  }
  return (
    <div className="h-[560px] space-y-2 overflow-y-auto pr-1">
      {events.map((e) => {
        const time = e.allDay ? null : fmtTime(e.start);
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onSelect(e)}
            className="block w-full rounded-[8px] border border-[#eeeeee] bg-white p-3 text-left transition-colors hover:border-[#dcdcdc] hover:bg-[#fafafa]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[14px] font-medium leading-5 text-[#101112]">
                {e.title}
              </div>
              {e.allDay && (
                <span className="shrink-0 rounded-[4px] bg-[#eff6ff] px-1.5 py-0.5 text-[11px] font-medium text-[#317cff]">
                  All day
                </span>
              )}
            </div>
            <p className="mt-1 text-[12px] leading-5 text-[#7b7b7b]">
              {fmtDate(e.start)}
              {time ? ` • ${time}` : ""}
            </p>
          </button>
        );
      })}
    </div>
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
        className="w-[360px] rounded-[10px] border border-[#eeeeee] bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-[#101112]">
            {isEditing ? "Edit event" : "New event"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] p-1 text-[#7b7b7b] transition-colors hover:bg-[#f5f5f5]"
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
            <span className="mb-1 block text-[12px] font-medium text-[#7b7b7b]">Customer</span>
            <select
              value={draft.customerId ?? ""}
              onChange={(e) => update({ customerId: e.target.value })}
              className="w-full rounded-[6px] border border-[#e6e6e9] bg-white px-2.5 py-1.5 text-[14px] text-[#101112] outline-none focus:border-[#317cff]"
            >
              <option value="">No customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
              placeholder="Optional — call link or address"
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
