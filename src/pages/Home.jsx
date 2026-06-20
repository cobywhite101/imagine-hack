import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Clock3,
  House,
  MailCheck,
  Sparkles,
  Tag,
  UserRound,
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
  const staleContacts = dashboard?.staleContacts ?? [];
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
          <section className="py-2">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a8a8f]">
              <Sparkles className="size-3.5 text-[#317cff]" strokeWidth={1.9} />
              {getBriefingLabel()}
            </p>
            <div className="flex items-stretch justify-between gap-6 rounded-[16px] border border-[#ececee] bg-gradient-to-b from-[#fbfbfc] to-white p-5 shadow-[0_1px_2px_rgba(16,17,18,0.04),0_10px_30px_rgba(16,17,18,0.035)]">
              <div className="min-w-0 flex-1">
                <h2 className="flex items-center gap-2 text-[22px] font-semibold tracking-[-0.01em] text-[#101112]">
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
                  <div className="mt-3 w-full space-y-2">
                    <SkeletonBlock height={22} width="96%" />
                    <SkeletonBlock height={22} width="78%" />
                  </div>
                ) : brief?.body ? (
                  <p
                    key={brief.body}
                    className="mt-3 max-w-[68ch] animate-grok-fade text-[16px] font-medium leading-7 text-[#3f3f46]"
                  >
                    <BriefBody body={brief.body} highlights={brief.bodyHighlights} />
                  </p>
                ) : null}
                {homeError ? (
                  <p className="mt-3 text-[12px] font-medium text-[#d4351c]">
                    Home data is using the latest available local state.
                  </p>
                ) : null}
              </div>
              <RemainingQuota />
            </div>
          </section>
        </div>

        <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 pb-6 pt-3 lg:grid-cols-[minmax(420px,1fr)_340px]">
          <div className="min-w-0 space-y-4">
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
            <QuietClients contacts={staleContacts} loading={initialLoading} />
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

// Eyebrow label above the briefing box, kept in step with the greeting period.
function getBriefingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning Briefing";
  if (hour < 17) return "Afternoon Briefing";
  return "Evening Briefing";
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
    tone: "blue",
    background: "bg-[rgba(49,124,255,0.05)]",
    headerBg: "bg-[rgba(49,124,255,0.14)]",
    text: "text-[#2b59b3]",
    accent: "bg-[#3b82f6]",
    addColor: "text-[#2f6fe0]",
    addShadow: "shadow-[0_0_0_1px_rgba(49,124,255,0.14)]",
  },
  {
    status: "In Progress",
    tone: "yellow",
    background: "bg-[rgba(214,158,46,0.07)]",
    headerBg: "bg-[rgba(214,158,46,0.2)]",
    text: "text-[#9a6b15]",
    accent: "bg-[#f5b13d]",
    addColor: "text-[#b07d1f]",
    addShadow: "shadow-[0_0_0_1px_rgba(214,158,46,0.16)]",
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
      <div className="flex flex-col gap-2 transition-all">
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
    <div className={`flex h-8 w-full items-center rounded-[8px] px-2 text-[13px] ${group.background}`}>
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
        "min-h-[80px] rounded-[10px] p-1.5 transition-shadow",
        group.background,
        isDragTarget ? "shadow-[inset_0_0_0_2px_rgba(70,161,113,0.35)]" : "",
      ].join(" ")}
    >
      <BoardHeader group={group} count={count} loading={loading} />
      <div className="mt-1.5 flex flex-col gap-1.5">
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
            <div
              className={[
                "flex flex-col gap-1.5",
                cards.length > 2 ? "max-h-[208px] overflow-y-auto pr-0.5" : "",
              ].join(" ")}
            >
              {cards.map((card) => (
                <TodoCard
                  key={card.id}
                  card={card}
                  onClick={() => onOpenTask(card)}
                  onDragStart={() => onDragStart(card.id)}
                  onDragEnd={onDragEnd}
                />
              ))}
            </div>
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

function quietClientInitials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter((part) => !["a/l", "a/p", "s/o", "d/o", "bin", "binti", "bt"].includes(part.toLowerCase()))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Surfaces clients with the longest gap since last contact, so the advisor can
// reconnect. Sits under the calendar in the left column.
function QuietClients({ contacts = [], loading }) {
  return (
    <section className="rounded-[16px] border border-[#ececee] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-[8px] bg-[#fff4e6] text-[#c47f17]">
            <UserRound className="size-3.5" strokeWidth={2} />
          </span>
          <h2 className="text-[14px] font-semibold leading-5 text-[#101112]">Quiet clients</h2>
        </div>
        <span className="text-[12px] leading-4 text-[#7b7b7b]">
          {loading ? "" : `${contacts.length} to reconnect`}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-[12px] border border-[#f0f0f0] px-3 py-2.5">
              <SkeletonBlock circle width={34} height={34} />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock height={14} width="42%" />
                <SkeletonBlock height={12} width="80%" />
              </div>
            </div>
          ))}
        </div>
      ) : contacts.length ? (
        <ul className="space-y-2">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link
                to={`/customers/${contact.id}`}
                className="flex items-center gap-3 rounded-[12px] border border-[#ededed] bg-white px-3 py-2.5 transition-all hover:border-[#d6d6d6] hover:shadow-[0_1px_2px_rgba(16,17,18,0.04),0_8px_20px_rgba(16,17,18,0.05)]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f0f1f4] text-[12px] font-semibold text-[#5a5a60]">
                  {quietClientInitials(contact.name) || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold leading-5 text-[#101112]">
                    {contact.name}
                  </p>
                  <p className="truncate text-[12px] leading-4 text-[#7b7b7b]">{contact.description}</p>
                </div>
                {Number.isFinite(contact.days) ? (
                  <span className="shrink-0 rounded-full bg-[#fdeecb] px-2 py-0.5 text-[11px] font-semibold text-[#9a6b15]">
                    {contact.days}d
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[#e6e6e8] px-3 py-6 text-center text-[13px] text-[#9a9aa0]">
          Everyone's been contacted recently. Nice work.
        </div>
      )}
    </section>
  );
}

function formatExpenseRm(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

// Compact remaining-quota chip on the right of the briefing box — surfaces only
// this month's remaining expense quota, in green, linking to My Expenses.
function RemainingQuota() {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api.getAdvisorExpenses(), api.getAdvisorExpenseQuota()])
      .then(([rows, quota]) => {
        if (!alive) return;
        const now = new Date();
        const monthTotal = (rows ?? []).reduce((total, row) => {
          const date = new Date(row.expenseDate || row.createdAt);
          if (Number.isNaN(date.getTime())) return total;
          if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) {
            return total;
          }
          return total + Number(row.amount || 0);
        }, 0);
        setRemaining(Math.max(0, Number(quota || 0) - monthTotal));
      })
      .catch(() => {
        if (alive) setRemaining(0);
      });
    return () => {
      alive = false;
    };
  }, []);

  const monthLabel = new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(new Date());

  return (
    <Link
      to="/expenses"
      className="flex shrink-0 flex-col items-end justify-center rounded-[12px] border border-[#e4ede8] bg-white px-5 py-4 text-right transition-colors hover:border-[#cfe0d6]"
    >
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-black/45">
        Remaining Quota
      </span>
      <span className="mt-1.5 whitespace-nowrap text-[28px] font-semibold tabular-nums leading-none text-[#16794c]">
        {remaining === null ? (
          <SkeletonBlock width={108} height={28} />
        ) : (
          formatExpenseRm(remaining)
        )}
      </span>
      <span className="mt-1.5 text-[11px] font-medium text-black/40">{monthLabel}</span>
    </Link>
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
        hasTags ? "min-h-[102px] items-start px-4 py-2.5" : "h-10 items-center px-4",
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
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {card.priority ? (
              <span className="rounded-[4px] bg-[rgba(3,87,31,0.11)] px-1.5 py-0.5 text-[12px] font-medium leading-4 text-[#2a533c]">
                <AlertCircle className="mr-1 inline size-3 align-[-1px]" strokeWidth={2} />
                Priority: {card.priority}
              </span>
            ) : null}
            {card.category ? (
              <span className="rounded-[4px] bg-[rgba(3,87,31,0.11)] px-1.5 py-0.5 text-[12px] font-medium leading-4 text-[#2a533c]">
                <Tag className="mr-1 inline size-3 align-[-1px]" strokeWidth={2} />
                Type: {card.category}
              </span>
            ) : null}
            {card.dueDate ? (
              <span className="rounded-[4px] bg-[rgba(3,87,31,0.11)] px-1.5 py-0.5 text-[12px] font-medium leading-4 text-[#2a533c]">
                <Clock3 className="mr-1 inline size-3 align-[-1px]" strokeWidth={2} />
                Due Date: {card.dueDate}
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
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
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
      dueDate,
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                  <option>In Progress</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[12px] font-medium leading-4 text-[#646462]">
                  <AlertCircle className="size-3 text-[#646462]" strokeWidth={2} />
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
                <span className="mb-1 flex items-center gap-1 text-[12px] font-medium leading-4 text-[#646462]">
                  <Tag className="size-3 text-[#646462]" strokeWidth={2} />
                  Type
                </span>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Feature request"
                  className="h-10 w-full rounded-[8px] border border-[#e9eae6] bg-white px-3 text-[14px] font-medium text-[#1a1a1a] outline-none placeholder:text-[#aaaaa8] focus:border-[#1a1a1a]"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[12px] font-medium leading-4 text-[#646462]">
                  <Clock3 className="size-3 text-[#646462]" strokeWidth={2} />
                  Due Date
                </span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="h-10 w-full rounded-[8px] border border-[#e9eae6] bg-white px-3 text-[14px] font-medium text-[#1a1a1a] outline-none focus:border-[#1a1a1a]"
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
    dueDate: new Date().toISOString().split("T")[0],
    status,
    notes: "",
    icon: "add",
    muted: false,
  };
}

function hasCardTags(card) {
  return Boolean(card.priority || card.category || card.dueDate);
}

function getTaskIcon(task) {
  if (task.status === "Done") return "check";
  if (task.id === "publish-release-notes") return "notepad";
  if (task.status === "Meeting") return "meeting";
  if (task.status === "In Progress") return "mail";
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
