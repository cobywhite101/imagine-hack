import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ListChecks,
  MailCheck,
} from "lucide-react";
import { MeetingsCalendar } from "../features/calendar/MeetingsCalendar";

export function Home() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-[#101112]">
      <header className="flex items-center justify-between border-b border-[#e8e8ea] bg-white px-6 py-3.5">
        <div>
          <h1 className="text-sm font-semibold">Home</h1>
          <p className="text-[11px] text-muted-foreground">
            Morning brief, meetings, and follow-ups for today
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
            <h2 className="text-[22px] font-semibold text-[#317cff] mb-2.5">
              Good morning, Daniel.
            </h2>
            <p className="max-w-[920px] text-[18px] font-medium leading-7 text-[#101112]">
              You have <span className="text-[#317cff] font-semibold">three meetings today</span>, with <span className="text-[#317cff] font-semibold">two follow-ups slipping</span>. <span className="text-[#317cff] font-semibold">Mei Lin's portfolio review at 9:30</span> is your first priority.
            </p>
          </section>
        </div>

        <AdvisorStatsStrip />

        <div className="grid w-[1179px] grid-cols-[1fr_360px] gap-4 px-4 pt-4 pb-6">
          <MeetingsCalendar />

          <div className="flex min-w-0 flex-col gap-4">
            <section className="rounded-[8px] border border-[#eeeeee] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-medium leading-5 text-[#4a4a4a]">
                  Follow-ups
                </h2>
                <span className="text-[12px] leading-4 text-[#7b7b7b]">2 due</span>
              </div>
              <div className="space-y-3">
                {followUps.map((item) => (
                  <div key={item.title} className="rounded-[8px] border border-[#eeeeee] p-3">
                    <div className="flex items-start gap-2">
                      <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#ef4444]" strokeWidth={1.9} />
                      <div>
                        <div className="text-[14px] font-medium leading-5 text-[#101112]">
                          {item.title}
                        </div>
                        <p className="mt-1 text-[12px] leading-5 text-[#7b7b7b]">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <TodoList />
          </div>
        </div>
      </div>
    </div>
  );
}

const meetings = [
  {
    time: "9:30",
    title: "Mei Lin's portfolio review",
    brief: "Review asset allocation, risk tolerance adjustments, and the proposed rebalancing plan.",
  },
  {
    time: "11:30",
    title: "Northwind ROI walkthrough",
    brief: "Use saved RevOps hours as the anchor and keep migration effort explicit.",
  },
  {
    time: "2:00",
    title: "Quanta sponsor re-engagement",
    brief: "Lead with the 21-day quiet period and propose one concrete renewal checkpoint.",
  },
];

const followUps = [
  {
    title: "Quanta Health",
    reason: "Executive sponsor has gone quiet for 21 days.",
  },
  {
    title: "Beacon Studios",
    reason: "Budget qualification is still open before next week's decision window.",
  },
];

const todoCards = [
  {
    title: "Publish release notes",
    icon: "notepad",
    tags: ["Low", "Feature request"],
  },
  {
    title: "Publish second notes",
    icon: "plus",
  },
  {
    title: "Release second notes",
    icon: "check",
  },
  {
    title: "New task",
    icon: "check",
    muted: true,
  },
  {
    title: "New task",
    icon: "add",
    muted: true,
    ghost: true,
  },
];

const stats = [
  {
    label: "To-do Tasks",
    value: "1",
    helper: "Task due today",
    icon: ListChecks,
    tone: "bg-[#f0fdf4] text-[#22c55e]",
  },
  {
    label: "Meetings",
    value: "3",
    helper: "Client meetings",
    icon: CalendarDays,
    tone: "bg-[#eff6ff] text-[#3b82f6]",
  },
  {
    label: "Follow-ups",
    value: "2",
    helper: "Follow-ups due",
    icon: MailCheck,
    tone: "bg-[#faf5ff] text-[#a855f7]",
  },
  {
    label: "Completed",
    value: "0",
    helper: "No tasks done yet",
    icon: CheckCircle2,
    tone: "bg-[#fef2f2] text-[#ef4444]",
  },
];

function AdvisorStatsStrip() {
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

function TodoList() {
  return (
    <section
      data-testid="home-todo-list"
      className="rounded-[16px] bg-[#fbfaf9] px-3.5 pb-4 pt-3.5 text-[#2c2c2b] shadow-[0_10px_24px_rgba(25,25,25,0.025)]"
    >
      <div className="mb-3 flex h-7 items-center gap-3 pl-1">
        <div className="inline-flex h-5 items-center rounded-full bg-[rgba(28,19,1,0.11)] px-2.5 text-[14px] font-medium leading-5 text-[#494846]">
          <span className="mr-1.5 size-2 rounded-full bg-[#8e8b86]" />
          To Do
        </div>
        <span className="text-[15px] font-medium leading-5 text-[#5f5e59]">4</span>
      </div>

      <div className="space-y-2">
        {todoCards.map((card) => (
          <button
            key={`${card.title}-${card.icon}-${card.ghost ? "ghost" : "card"}`}
            type="button"
            className={[
              "flex w-full rounded-[10px] bg-white text-left transition-colors hover:bg-[#f8f8f7]",
              card.tags ? "min-h-[102px] items-start px-4 py-3.5" : "h-20 items-center px-4",
              card.ghost
                ? "border border-[rgba(42,28,0,0.035)] shadow-none"
                : "shadow-[0_4px_12px_rgba(25,25,25,0.027),0_1px_2px_rgba(25,25,25,0.02),0_0_0_1px_rgba(42,28,0,0.07)]",
            ].join(" ")}
          >
            <TodoIcon type={card.icon} muted={card.muted} />
            <div className="min-w-0 flex-1">
              <div
                className={[
                  "truncate text-[16px] font-semibold leading-6",
                  card.muted ? "text-[#a19e99]" : "text-[#2c2c2b]",
                ].join(" ")}
              >
                {card.title}
              </div>
              {card.tags ? (
                <div className="mt-4 flex flex-col items-start gap-2">
                  <span className="rounded-[4px] bg-[rgba(3,87,31,0.11)] px-1.5 py-0.5 text-[13px] font-medium leading-5 text-[#2a533c]">
                    Low
                  </span>
                  <span className="rounded-[4px] bg-[rgba(3,87,31,0.11)] px-1.5 py-0.5 text-[13px] font-medium leading-5 text-[#2a533c]">
                    <span className="mr-1">💬</span>
                    Feature request
                  </span>
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function TodoIcon({ type, muted = false }) {
  if (type === "notepad") {
    return (
      <span className="mr-3 mt-0.5 flex size-7 shrink-0 items-center justify-center text-[20px] leading-none">
        🗒️
      </span>
    );
  }

  if (type === "plus") {
    return (
      <img
        src="https://app.notion.com/icons/add_pink.svg?mode=light"
        alt=""
        className="mr-3 size-7 shrink-0"
      />
    );
  }

  if (type === "check") {
    return (
      <img
        src="https://app.notion.com/icons/checkmark_green.svg?mode=light"
        alt=""
        className={[
          "mr-3 size-7 shrink-0",
          muted ? "opacity-75 grayscale-[0.15]" : "",
        ].join(" ")}
      />
    );
  }

  return (
    <span className="mr-3 flex size-7 shrink-0 items-center justify-center text-[24px] font-light leading-none text-[#a19e99]">
      +
    </span>
  );
}
