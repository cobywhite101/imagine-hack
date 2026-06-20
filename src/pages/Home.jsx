import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  MailCheck,
} from "lucide-react";
import { MeetingsCalendar } from "../features/calendar/MeetingsCalendar";
import { api } from "@/services/dataClient";

export function Home() {
  const [dashboard, setDashboard] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [homeError, setHomeError] = useState(null);
  const todoCards = dashboard?.tasks ?? [];
  const meetings = dashboard?.meetings ?? [];
  const brief = dashboard?.brief ?? defaultBrief;
  const statItems = mergeHomeStats(dashboard?.stats ?? defaultStats);

  const refreshHomeDashboard = useCallback(async () => {
    try {
      const next = await api.getHomeDashboard();
      setDashboard(next);
      setHomeError(null);
    } catch (error) {
      setHomeError(error);
    }
  }, []);

  useEffect(() => {
    refreshHomeDashboard();
    return api.subscribeHomeDashboard(refreshHomeDashboard);
  }, [refreshHomeDashboard]);

  async function saveTodoTask(task) {
    const nextTask = {
      ...task,
      title: task.title.trim(),
      icon: getTaskIcon(task),
      muted: task.status === "Done",
    };

    try {
      await api.saveHomeTask(nextTask);
      await refreshHomeDashboard();
      setEditingTask(null);
    } catch (error) {
      setHomeError(error);
    }
  }

  async function deleteTodoTask(taskId) {
    try {
      await api.deleteHomeTask(taskId);
      await refreshHomeDashboard();
      setEditingTask(null);
    } catch (error) {
      setHomeError(error);
    }
  }

  async function saveMeeting(event) {
    const saved = await api.saveAdvisorMeeting(event);
    await refreshHomeDashboard();
    return saved;
  }

  async function deleteMeeting(eventId) {
    const deleted = await api.deleteAdvisorMeeting(eventId);
    await refreshHomeDashboard();
    return deleted;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-[#101112]">
      <header className="flex items-center justify-between border-b border-[#e8e8ea] bg-white px-6 py-3.5">
        <div>
          <h1 className="text-sm font-semibold">Home</h1>
          <p className="text-[11px] text-muted-foreground">
            Morning brief, meetings, and follow-ups synced from Supabase
          </p>
        </div>
        <div className="flex h-7 items-center gap-1.5 rounded-lg bg-[#f7f7f8] px-2 text-[12px] font-medium text-black/55">
          <Clock3 className="size-3.5" strokeWidth={1.8} />
          Today
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        <div className="w-[1179px] px-4 pt-4">
          <section className="rounded-[8px] border border-[#eeeeee] bg-white p-5 text-[#4a4a4a]">
            <h2 className="mb-2.5 text-[22px] font-semibold text-[#101112]">
              Good morning, {brief.advisorName}.
            </h2>
            <p className="max-w-[920px] text-[18px] font-medium leading-7 text-[#101112]">
              You have <span className="font-semibold text-[#101112]">{brief.meetingsText}</span>, with <span className="font-semibold text-[#101112]">{brief.followUpsText}</span>. <span className="font-semibold text-[#101112]">{brief.priorityText}</span> is your first priority.
            </p>
            {homeError ? (
              <p className="mt-2 text-[12px] font-medium text-[#d4351c]">
                Home data is using the latest available local state.
              </p>
            ) : null}
          </section>
        </div>

        <AdvisorStatsStrip stats={statItems} />

        <div className="w-[1179px] px-4 pb-6 pt-4">
          <TodoList
            cards={todoCards}
            onOpenTask={setEditingTask}
            onNewTask={(status) => setEditingTask(createTodoDraft(status))}
          />
        </div>

        <div className="w-[1179px] px-4 pb-6 pt-4">
          <MeetingsCalendar
            events={meetings}
            onSaveEvent={saveMeeting}
            onDeleteEvent={deleteMeeting}
          />
        </div>
      </div>
      {editingTask && (
        <TodoTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={saveTodoTask}
          onDelete={deleteTodoTask}
        />
      )}
    </div>
  );
}

const defaultBrief = {
  advisorName: "Daniel",
  meetingsText: "0 meetings today",
  followUpsText: "0 follow-ups due",
  priorityText: "Your client task board",
};

const defaultStats = [
  {
    id: "todo",
    label: "To-do Tasks",
    value: "0",
    helper: "No tasks due today",
    icon: ListChecks,
    tone: "bg-[#f0fdf4] text-[#22c55e]",
  },
  {
    id: "meetings",
    label: "Meetings",
    value: "0",
    helper: "No meetings today",
    icon: CalendarDays,
    tone: "bg-[#eff6ff] text-[#3b82f6]",
  },
  {
    id: "followups",
    label: "Follow-ups",
    value: "0",
    helper: "No follow-ups due",
    icon: MailCheck,
    tone: "bg-[#faf5ff] text-[#a855f7]",
  },
  {
    id: "completed",
    label: "Completed",
    value: "0",
    helper: "No tasks done yet",
    icon: CheckCircle2,
    tone: "bg-[#fef2f2] text-[#ef4444]",
  },
];

function mergeHomeStats(items) {
  return defaultStats.map((fallback) => ({
    ...fallback,
    ...(items.find((item) => item.id === fallback.id || item.label === fallback.label) ?? {}),
  }));
}

function AdvisorStatsStrip({ stats = defaultStats }) {
  return (
    <div className="flex h-[126px] w-[1179px] px-4 pt-4 text-black transition-all">
      <div className="h-[110px] w-[1147px] flex-1 bg-white transition-all">
        <div className="flex h-[110px] w-[1147px] justify-between space-x-3 transition-all">
          {stats.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper, icon: Icon, tone }) {
  return (
    <div className="h-[110px] flex-1 rounded-[8px] border border-[#eeeeee] px-4 pb-3 pt-4 text-[#4a4a4a] transition-all">
      <div className="mb-4 flex h-8 items-center transition-all">
        <div
          className={`mr-3 flex size-8 items-center justify-center rounded-[6px] transition-all ${tone}`}
        >
          <Icon className="size-4" strokeWidth={1.9} />
        </div>
        <p className="text-[14px] font-medium leading-5 transition-all">{label}</p>
      </div>
      <div className="flex h-8 items-baseline transition-all">
        <p className="mr-1 text-[24px] font-semibold leading-8 transition-all">{value}</p>
        <div className="ml-2 mt-1 text-[12px] leading-4 text-[#7b7b7b] transition-all">
          {helper}
        </div>
      </div>
    </div>
  );
}

const boardGroups = [
  {
    status: "To Do",
    tone: "neutral",
    background: "bg-[rgba(66,35,3,0.03)]",
    headerBg: "bg-[rgba(28,19,1,0.11)]",
    text: "text-[#494846]",
    accent: "bg-[#8e8b86]",
    addColor: "text-[#5f5e59]",
    addShadow: "shadow-[0_0_0_1px_rgba(42,28,0,0.07)]",
  },
  {
    status: "In progress",
    tone: "blue",
    background: "bg-[rgba(0,128,213,0.047)]",
    headerBg: "bg-[rgba(0,118,217,0.204)]",
    text: "text-[#264a72]",
    accent: "bg-[#2783de]",
    addColor: "text-[#2783de]",
    addShadow: "shadow-[0_0_0_1px_rgba(0,124,215,0.094)]",
  },
  {
    status: "Follow-up",
    tone: "purple",
    background: "bg-[rgba(126,34,206,0.047)]",
    headerBg: "bg-[rgba(126,34,206,0.15)]",
    text: "text-[#6f3ca6]",
    accent: "bg-[#a855f7]",
    addColor: "text-[#8b5cf6]",
    addShadow: "shadow-[0_0_0_1px_rgba(126,34,206,0.09)]",
  },
  {
    status: "Done",
    tone: "green",
    background: "bg-[rgba(3,87,31,0.035)]",
    headerBg: "bg-[rgba(0,96,38,0.157)]",
    text: "text-[#2a533c]",
    accent: "bg-[#46a171]",
    addColor: "text-[#46a171]",
    addShadow: "shadow-[0_0_0_1px_rgba(0,100,45,0.09)]",
  },
];

function TodoList({ cards, onOpenTask, onNewTask }) {
  return (
    <div
      data-testid="home-todo-list"
      className="w-[1169px] overflow-x-auto text-[#2c2c2b] transition-all"
    >
      <div className="relative w-max pl-2 pt-12 transition-all">
        <div className="absolute left-2 top-0 z-10 h-12 w-max bg-white pt-2">
          <div className="inline-flex">
            {boardGroups.map((group) => {
              const groupCards = cards.filter((card) => card.status === group.status);
              return (
                <BoardHeader
                  key={group.status}
                  group={group}
                  count={groupCards.length}
                />
              );
            })}
          </div>
        </div>

        <div className="relative flex w-max transition-all">
          {boardGroups.map((group) => {
            const groupCards = cards.filter((card) => card.status === group.status);
            return (
              <BoardGroup
                key={group.status}
                group={group}
                cards={groupCards}
                onOpenTask={onOpenTask}
                onNewTask={onNewTask}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BoardHeader({ group, count }) {
  return (
    <div className={`mr-3 flex h-10 w-[276px] shrink-0 items-center rounded-t-[10px] px-2 text-[14px] ${group.background}`}>
      <div className="flex items-center rounded-[6px] p-[3px]">
        <div className={`inline-flex h-5 max-w-full items-center rounded-[10px] px-[7px] pr-[9px] text-[14px] leading-[20px] ${group.headerBg} ${group.text}`}>
          <span className={`mr-[5px] size-2 shrink-0 rounded-full ${group.accent}`} />
          <span className="truncate whitespace-nowrap">{group.status}</span>
        </div>
      </div>
      <div className={`ml-0 flex min-h-5 min-w-5 items-center rounded px-1.5 font-normal ${group.text === "text-[#494846]" ? "text-[#5f5e59]" : group.text}`}>
        {count}
      </div>
      <div className="flex-1" />
    </div>
  );
}

function BoardGroup({ group, cards, onOpenTask, onNewTask }) {
  return (
    <div className={`mr-3 box-content h-max w-[260px] shrink-0 rounded-b-[10px] px-2 pb-2 ${group.background}`}>
      <div className="h-[3px] w-[260px]" />
      {cards.map((card) => (
        <TodoCard key={card.id} card={card} onClick={() => onOpenTask(card)} />
      ))}
      <button
        type="button"
        onClick={() => onNewTask(group.status)}
        className={[
          "inline-flex h-10 w-[260px] items-center gap-[9px] rounded-[10px] bg-white px-2.5 text-[15px] leading-[18px] transition-colors hover:bg-[#f8f8f7]",
          group.addColor,
          group.addShadow,
        ].join(" ")}
      >
        <span className="flex size-4 items-center justify-center text-[22px] font-light leading-none">
          +
        </span>
        <span>New task</span>
      </button>
    </div>
  );
}

function TodoCard({ card, onClick }) {
  const hasTags = hasCardTags(card);
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "mb-2 flex w-[260px] rounded-[10px] bg-white text-left transition-colors hover:bg-[#f8f8f7]",
        hasTags ? "h-[102px] items-start px-4 py-2.5" : "h-10 items-center px-4",
        "shadow-[0_4px_12px_rgba(25,25,25,0.027),0_1px_2px_rgba(25,25,25,0.02),0_0_0_1px_rgba(42,28,0,0.07)]",
      ].join(" ")}
    >
      <TodoIcon type={card.icon} muted={card.muted} compact={!hasTags} />
      <div className="min-w-0 flex-1">
        <div
          className={[
            "truncate text-[16px] font-semibold leading-6",
            card.muted ? "text-[#a19e99]" : "text-[#2c2c2b]",
          ].join(" ")}
        >
          {card.title}
        </div>
        {hasTags ? (
          <div className="mt-2.5 flex flex-col items-start gap-1">
            {card.priority ? (
              <span className="rounded-[4px] bg-[rgba(3,87,31,0.11)] px-1.5 py-0.5 text-[13px] font-medium leading-[18px] text-[#2a533c]">
                {card.priority}
              </span>
            ) : null}
            {card.category ? (
              <span className="rounded-[4px] bg-[rgba(3,87,31,0.11)] px-1.5 py-0.5 text-[13px] font-medium leading-[18px] text-[#2a533c]">
                <span className="mr-1">💬</span>
                {card.category}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function TodoTaskModal({ task, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(task.title ?? "");
  const [priority, setPriority] = useState(task.priority ?? "");
  const [category, setCategory] = useState(task.category ?? "");
  const [status, setStatus] = useState(task.status ?? "To Do");
  const [notes, setNotes] = useState(task.notes ?? "");
  const canSave = title.trim().length > 0;
  const isExistingTask = !!task.id;

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  function handleSave() {
    if (!canSave) return;
    onSave({
      ...task,
      title,
      priority,
      category,
      status,
      notes,
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/30 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(20,20,20,0.24)]">
        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between rounded-t-2xl border-b border-[#e9eae6] bg-white px-6 py-4">
          <h1 className="truncate pr-2 text-[20px] font-semibold leading-8 text-[#1a1a1a]">
            Task details
          </h1>
          <div className="flex items-center gap-x-2">
            {isExistingTask && (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="h-8 rounded-full bg-[#fff5f5] px-3 text-[14px] font-semibold leading-4 text-[#fa5252] transition-colors hover:bg-[#ffe3e3]"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-full bg-[#f8f8f7] px-3 text-[14px] font-semibold leading-4 text-[#1a1a1a] transition-colors hover:bg-[#eeeeec]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={[
                "h-8 rounded-full px-3 text-[14px] font-semibold leading-4 transition-colors",
                canSave
                  ? "bg-[#1a1a1a] text-white hover:bg-black"
                  : "cursor-not-allowed bg-[#f8f8f7] text-[#81817e]",
              ].join(" ")}
            >
              Save
            </button>

            <div className="mx-2 h-5 w-px bg-[#e9eae6]" />

            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-[#f8f8f7] text-[#1a1a1a] transition-colors hover:bg-[#eeeeec]"
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M13.25 3.95L12.05 2.75L8 6.8L3.95 2.75L2.75 3.95L6.8 8L2.75 12.05L3.95 13.25L8 9.2L12.05 13.25L13.25 12.05L9.2 8L13.25 3.95Z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex w-full max-w-[640px] flex-col px-10 pb-12 pt-10">
            <textarea
              rows={1}
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="New task"
              aria-label="Task title"
              className="mb-6 block w-full resize-none overflow-hidden border-none bg-transparent p-0 text-[32px] font-bold leading-[1.3] text-[#1a1a1a] outline-none placeholder:text-[#aaaaa8]"
            />

            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium leading-4 text-[#646462]">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="h-10 w-full rounded-[8px] border border-[#e9eae6] bg-white px-3 text-[14px] font-medium text-[#1a1a1a] outline-none focus:border-[#1a1a1a]"
                >
                  <option>To Do</option>
                  <option>In progress</option>
                  <option>Follow-up</option>
                  <option>Done</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium leading-4 text-[#646462]">
                  Priority
                </span>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="h-10 w-full rounded-[8px] border border-[#e9eae6] bg-white px-3 text-[14px] font-medium text-[#1a1a1a] outline-none focus:border-[#1a1a1a]"
                >
                  <option value="">None</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium leading-4 text-[#646462]">
                  Type
                </span>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Feature request"
                  className="h-10 w-full rounded-[8px] border border-[#e9eae6] bg-white px-3 text-[14px] font-medium text-[#1a1a1a] outline-none placeholder:text-[#aaaaa8] focus:border-[#1a1a1a]"
                />
              </label>
            </div>

            <label className="mt-6 block">
              <span className="mb-1 block text-[12px] font-medium leading-4 text-[#646462]">
                Notes
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add context..."
                className="min-h-[160px] w-full resize-none rounded-[12px] border border-[#e9eae6] bg-white p-3 text-[15px] leading-6 text-[#1a1a1a] outline-none placeholder:text-[#aaaaa8] focus:border-[#1a1a1a]"
              />
            </label>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function createTodoDraft(status = "To Do") {
  return {
    id: null,
    title: "New task",
    priority: "",
    category: "",
    status,
    notes: "",
    icon: "add",
    muted: false,
  };
}

function hasCardTags(card) {
  return Boolean(card.priority || card.category);
}

function getTaskIcon(task) {
  if (task.status === "Done") return "check";
  if (task.id === "publish-release-notes") return "notepad";
  if (task.status === "In progress") return "notepad";
  if (task.status === "Follow-up") return "mail";
  return "plus";
}

function TodoIcon({ type, muted = false, compact = false }) {
  const iconClass = [
    "mr-3 shrink-0",
    compact ? "size-5" : "size-7",
    muted ? "opacity-75 grayscale-[0.15]" : "",
  ].join(" ");

  if (type === "notepad") {
    return (
      <span
        className={[
          "flex items-center justify-center leading-none",
          compact ? "mr-3 size-5 text-[17px]" : "mr-3 mt-0.5 size-7 text-[20px]",
        ].join(" ")}
      >
        🗒️
      </span>
    );
  }

  if (type === "plus") {
    return (
      <img
        src="https://app.notion.com/icons/add_pink.svg?mode=light"
        alt=""
        className={iconClass}
      />
    );
  }

  if (type === "check") {
    return (
      <img
        src="https://app.notion.com/icons/checkmark_green.svg?mode=light"
        alt=""
        className={iconClass}
      />
    );
  }

  if (type === "mail") {
    return (
      <span
        className={[
          "mr-3 flex shrink-0 items-center justify-center rounded-[6px] bg-[#faf5ff] text-[#8b5cf6]",
          compact ? "size-5" : "mt-0.5 size-7",
        ].join(" ")}
      >
        <MailCheck className={compact ? "size-3.5" : "size-4"} strokeWidth={2} />
      </span>
    );
  }

  return (
    <span
      className={[
        "mr-3 flex shrink-0 items-center justify-center font-light leading-none text-[#a19e99]",
        compact ? "size-5 text-[20px]" : "size-7 text-[24px]",
      ].join(" ")}
    >
      +
    </span>
  );
}
