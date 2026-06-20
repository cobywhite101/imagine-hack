import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Clock3,
  House,
  MailCheck,
  Tag,
} from "lucide-react";
import { MeetingsCalendar } from "../features/calendar/MeetingsCalendar";
import { api } from "@/services/dataClient";
import { SkeletonBlock } from "@/components/ui/skeleton";

export function Home() {
  const [searchParams] = useSearchParams();
  const [dashboard, setDashboard] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [homeError, setHomeError] = useState(null);
  const todoCards = dashboard?.tasks ?? [];
  const meetings = dashboard?.meetings ?? [];
  const brief = dashboard?.brief;
  const selectedMeetingId = searchParams.get("meeting");
  const initialLoading = dashboard === null && !homeError;
  const briefHeadline = brief?.headline ?? getTimeBasedBriefHeadline();

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

  async function moveTodoTask(task, status) {
    if (!task || task.status === status) return;
    await saveTodoTask({
      ...task,
      status,
    });
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
      <header className="flex h-[49px] shrink-0 items-center justify-between border-b border-[#e6e7ea] bg-white px-4 text-[#101112]">
        <div className="flex min-w-0 items-center gap-2">
          <House className="size-4 shrink-0" strokeWidth={1.9} />
          <h1 className="truncate text-[14px] font-semibold leading-5 tracking-[-0.01em]">
            Home
          </h1>
        </div>
        <div className="flex h-7 items-center gap-1.5 rounded-lg bg-[#f7f7f8] px-2 text-[12px] font-medium text-black/55">
          <Clock3 className="size-3.5" strokeWidth={1.8} />
          Today
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4">
          <section className="rounded-[8px] bg-white py-4 text-[#4a4a4a]">
            <h2 className="mb-2.5 flex items-center gap-2 text-[22px] font-semibold text-[#101112]">
              {initialLoading ? (
                <SkeletonBlock width={260} height={28} />
              ) : (
                <>
                  <span
                    className="inline-block origin-[70%_75%] animate-wave text-[24px] leading-none"
                    aria-hidden="true"
                  >
                    👋
                  </span>
                  <span>{briefHeadline}</span>
                </>
              )}
            </h2>
            {initialLoading ? (
              <div className="w-full space-y-2">
                <SkeletonBlock height={24} width="96%" />
                <SkeletonBlock height={24} width="78%" />
              </div>
            ) : brief?.body ? (
              <p
                key={brief.body}
                className="max-w-[68ch] animate-grok-fade text-[18px] font-medium leading-7 text-[#101112]"
              >
                <BriefBody body={brief.body} highlights={brief.bodyHighlights} />
              </p>
            ) : null}
            {homeError ? (
              <p className="mt-2 text-[12px] font-medium text-[#d4351c]">
                Home data is using the latest available local state.
              </p>
            ) : null}
          </section>
        </div>

        <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 pb-6 pt-3 lg:grid-cols-[minmax(420px,1fr)_390px]">
          <div className="min-w-0">
            {initialLoading ? (
              <HomeCalendarSkeleton />
            ) : (
              <MeetingsCalendar
                events={meetings}
                onSaveEvent={saveMeeting}
                onDeleteEvent={deleteMeeting}
                selectedEventId={selectedMeetingId}
              />
            )}
          </div>

          <TodoList
            cards={todoCards}
            loading={initialLoading}
            onOpenTask={setEditingTask}
            onNewTask={(status) => setEditingTask(createTodoDraft(status))}
            onMoveTask={moveTodoTask}
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

function getTimeBasedBriefHeadline() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning, Ferdinand.";
  }

  if (hour < 17) {
    return "Good afternoon, Ferdinand.";
  }

  return "Good evening, Ferdinand.";
}

const briefHighlightTones = {
  meetings: "text-[#2563eb]",
  followups: "text-[#8b5cf6]",
  priority: "text-[#dc2626]",
};

const briefHighlightEmoji = {
  meetings: "📅",
  followups: "📬",
  priority: "🔥",
};

function BriefBody({ body, highlights = [] }) {
  const parts = getBriefBodyParts(body, highlights);

  return parts.map((part, index) => {
    if (!part.tone) return part.text;

    const emoji = briefHighlightEmoji[part.tone];

    return (
      <span
        key={`${part.tone}-${part.text}-${index}`}
        className={`whitespace-nowrap ${briefHighlightTones[part.tone] ?? "text-[#101112]"}`}
      >
        {emoji ? (
          <span className="mr-1 align-[-1px]" aria-hidden="true">
            {emoji}
          </span>
        ) : null}
        {part.text}
      </span>
    );
  });
}

function getBriefBodyParts(body = "", highlights = []) {
  const remainingHighlights = highlights.filter((highlight) => highlight?.text);
  if (!remainingHighlights.length) return [{ text: body }];

  const parts = [];
  let cursor = 0;

  while (cursor < body.length) {
    const nextHighlight = remainingHighlights
      .map((highlight) => ({
        ...highlight,
        index: body.indexOf(highlight.text, cursor),
      }))
      .filter((highlight) => highlight.index >= 0)
      .sort((a, b) => a.index - b.index || b.text.length - a.text.length)[0];

    if (!nextHighlight) {
      parts.push({ text: body.slice(cursor) });
      break;
    }

    if (nextHighlight.index > cursor) {
      parts.push({ text: body.slice(cursor, nextHighlight.index) });
    }

    parts.push({ text: nextHighlight.text, tone: nextHighlight.tone });
    cursor = nextHighlight.index + nextHighlight.text.length;
  }

  return parts.length ? parts : [{ text: body }];
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
    status: "in progress",
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
    background: "bg-[rgba(3,87,31,0.02)]",
    headerBg: "bg-[rgba(0,96,38,0.075)]",
    text: "text-[#6d7270]",
    accent: "bg-[#6e8c76]",
    addColor: "text-[#6e8c76]",
    addShadow: "shadow-[0_0_0_1px_rgba(0,100,45,0.05)]",
  },
];

function TodoList({ cards, loading, onOpenTask, onNewTask, onMoveTask }) {
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const draggedCard = cards.find((card) => card.id === draggedCardId);

  function handleDrop(status) {
    if (!draggedCard) return;
    onMoveTask(draggedCard, status);
    setDraggedCardId(null);
    setDragOverStatus(null);
  }

  return (
    <div
      data-testid="home-todo-list"
      className="min-w-0 text-[#2c2c2b] transition-all"
    >
      <div className="flex flex-col gap-3 transition-all">
        {boardGroups.map((group) => {
          const groupCards = cards.filter((card) => card.status === group.status);
          return (
            <BoardGroup
              key={`group-${group.status}`}
              group={group}
              count={groupCards.length}
              cards={groupCards}
              loading={loading}
              onOpenTask={onOpenTask}
              onNewTask={onNewTask}
              onDropTask={handleDrop}
              onDragStart={setDraggedCardId}
              onDragEnd={() => {
                setDraggedCardId(null);
                setDragOverStatus(null);
              }}
              onDragOver={setDragOverStatus}
              isDragTarget={dragOverStatus === group.status && draggedCard?.status !== group.status}
            />
          );
        })}
      </div>
    </div>
  );
}

function BoardHeader({ group, count, loading }) {
  return (
    <div className={`flex h-9 w-full items-center rounded-[8px] px-2 text-[13px] ${group.background}`}>
      <div className="flex items-center rounded-[6px] p-[3px]">
        <div className={`inline-flex h-5 max-w-full items-center rounded-[10px] px-[7px] pr-[9px] text-[13px] leading-[20px] ${group.headerBg} ${group.text}`}>
          <span className={`mr-[5px] size-2 shrink-0 rounded-full ${group.accent}`} />
          <span className="truncate whitespace-nowrap">{group.status}</span>
        </div>
      </div>
      <div className={`ml-0 flex min-h-5 min-w-5 items-center rounded px-1.5 font-normal ${group.text === "text-[#494846]" ? "text-[#5f5e59]" : group.text}`}>
        {loading ? <SkeletonBlock width={16} height={14} /> : count}
      </div>
      <div className="flex-1" />
    </div>
  );
}

function BoardGroup({
  group,
  count,
  cards,
  loading,
  onOpenTask,
  onNewTask,
  onDropTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  isDragTarget,
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(group.status);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onDragOver(null);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropTask(group.status);
      }}
      className={[
        "min-h-[132px] rounded-[10px] p-2 transition-shadow",
        group.background,
        isDragTarget ? "shadow-[inset_0_0_0_2px_rgba(70,161,113,0.35)]" : "",
      ].join(" ")}
    >
      <BoardHeader group={group} count={count} loading={loading} />
      <div className="mt-2 flex flex-col gap-2">
        {loading ? (
          <>
            <TodoCardSkeleton tall />
            <TodoCardSkeleton />
            <div className="h-10 w-full rounded-[10px] bg-white px-3 py-2.5 shadow-[0_0_0_1px_rgba(42,28,0,0.07)]">
              <SkeletonBlock width={86} height={16} />
            </div>
          </>
        ) : (
          <>
            {cards.map((card) => (
              <TodoCard
                key={card.id}
                card={card}
                onClick={() => onOpenTask(card)}
                onDragStart={() => onDragStart(card.id)}
                onDragEnd={onDragEnd}
              />
            ))}
            {group.status !== "Done" ? (
              <button
                type="button"
                onClick={() => onNewTask(group.status)}
                className={[
                  "inline-flex h-10 w-full items-center gap-[9px] rounded-[10px] bg-white px-2.5 text-[13px] leading-[18px] transition-colors hover:bg-[#f8f8f7]",
                  group.addColor,
                  group.addShadow,
                ].join(" ")}
              >
                <span className="flex size-4 items-center justify-center text-[22px] font-light leading-none">
                  +
                </span>
                <span>New task</span>
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function TodoCardSkeleton({ tall = false }) {
  return (
    <div
      className={[
        "flex w-full rounded-[10px] bg-white px-3 shadow-[0_4px_12px_rgba(25,25,25,0.027),0_1px_2px_rgba(25,25,25,0.02),0_0_0_1px_rgba(42,28,0,0.07)]",
        tall ? "h-[102px] items-start py-2.5" : "h-10 items-center",
      ].join(" ")}
    >
      <SkeletonBlock circle width={18} height={18} className="mr-2.5" />
      <div className="min-w-0 flex-1">
        <SkeletonBlock height={16} width={tall ? 180 : 150} />
        {tall ? (
          <div className="mt-3 space-y-1.5">
            <SkeletonBlock height={18} width={72} />
            <SkeletonBlock height={18} width={118} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HomeCalendarSkeleton() {
  return (
    <section className="rounded-[8px] border border-[#eeeeee] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <SkeletonBlock width={128} height={20} />
        <div className="flex items-center gap-3">
          <SkeletonBlock width={176} height={30} />
          <SkeletonBlock width={84} height={16} />
          <SkeletonBlock width={62} height={28} />
        </div>
      </div>
      <div className="rounded-[6px] border border-[#eeeeee]">
        <div className="grid grid-cols-7 border-b border-[#eeeeee] bg-[#fafafa]">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="px-3 py-2">
              <SkeletonBlock height={14} width={44} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, index) => (
            <div
              key={index}
              className="h-[84px] border-b border-r border-[#eeeeee] p-2 last:border-r-0"
            >
              <SkeletonBlock width={18} height={14} />
              {index % 5 === 1 ? (
                <div className="mt-3">
                  <SkeletonBlock height={18} width="82%" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TodoCard({ card, onClick, onDragStart, onDragEnd }) {
  const hasTags = hasCardTags(card);
  const didDragRef = useRef(false);

  return (
    <button
      type="button"
      draggable
      onClick={(event) => {
        if (didDragRef.current) {
          event.preventDefault();
          didDragRef.current = false;
          return;
        }
        onClick();
      }}
      onDragStart={(event) => {
        didDragRef.current = true;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={[
        "flex w-full cursor-grab rounded-[10px] bg-white text-left transition-colors hover:bg-[#f8f8f7] active:cursor-grabbing",
        hasTags ? "h-[102px] items-start px-4 py-2.5" : "h-10 items-center px-4",
        "shadow-[0_4px_12px_rgba(25,25,25,0.027),0_1px_2px_rgba(25,25,25,0.02),0_0_0_1px_rgba(42,28,0,0.07)]",
      ].join(" ")}
    >
      <TodoIcon type={card.icon} muted={card.muted} compact={!hasTags} />
      <div className="min-w-0 flex-1">
        <div
          className={[
            "truncate text-[14px] font-semibold leading-5",
            card.muted ? "text-[#a19e99]" : "text-[#2c2c2b]",
          ].join(" ")}
        >
          {card.title}
        </div>
        {hasTags ? (
          <div className="mt-2.5 flex flex-col items-start gap-1">
            {card.priority ? (
              <span className="rounded-[4px] bg-[rgba(3,87,31,0.11)] px-1.5 py-0.5 text-[12px] font-medium leading-4 text-[#2a533c]">
                {card.priority}
              </span>
            ) : null}
            {card.category ? (
              <span className="rounded-[4px] bg-[rgba(3,87,31,0.11)] px-1.5 py-0.5 text-[12px] font-medium leading-4 text-[#2a533c]">
                <Tag className="mr-1 inline size-3 align-[-1px]" strokeWidth={2} />
                Type: {card.category}
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
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
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
          <div className="flex w-full flex-col px-6 pb-12 pt-10">
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
                  <option>Meeting</option>
                  <option>in progress</option>
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
  if (task.status === "Meeting") return "meeting";
  if (task.status === "in progress") return "mail";
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

  if (type === "meeting") {
    return (
      <span
        className={[
          "mr-3 flex shrink-0 items-center justify-center rounded-[6px] bg-[#eff6ff] text-[#2783de]",
          compact ? "size-5" : "mt-0.5 size-7",
        ].join(" ")}
      >
        <Clock3 className={compact ? "size-3.5" : "size-4"} strokeWidth={2} />
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
