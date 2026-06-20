import { useEffect, useState, useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  House,
  MoreVertical,
  Plus,
  RotateCcw,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { DotmSquare6 } from "@/components/ui/dotm-square-6";
import { ChatMessage } from "@/features/chat/ChatMessage";
import { api } from "@/services/dataClient";

const assistantSections = [
  {
    title: "Data Management",
    items: [
      "Look up, create, and update records (Companies, People, etc.)",
      "Search and filter your CRM data",
      "Add notes to records",
    ],
  },
  {
    title: "Tasks",
    items: [
      "Create, update, complete, and delete tasks",
      "Assign tasks to workspace members and link them to records",
    ],
  },
  {
    title: "Emails",
    items: ["Search through synced emails", "Draft follow-up emails for review"],
  },
  {
    title: "Calls & Meetings",
    items: [
      "Search and summarize call recordings",
      "Pull key snippets and insights from calls",
      "Look up past and upcoming meetings",
    ],
  },
  {
    title: "Workflows",
    items: [
      "Create and edit workflow automations",
      "Explain existing workflows",
      "Help you build triggers and actions",
    ],
  },
  {
    title: "Research",
    items: [
      "Search the web for information about companies or people not in your workspace",
    ],
  },
];

function IconButton({ label, children, className = "" }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex size-7 items-center justify-center rounded-lg text-black/55 transition-colors hover:bg-black/[0.04] ${className}`}
    >
      {children}
    </button>
  );
}

function TopBar({ mode }) {
  if (mode === "chat") {
    return (
      <header className="flex h-[49px] shrink-0 items-center justify-between border-b border-[#e8e8ea] bg-white px-4 text-[#101112]">
        <div className="flex items-center gap-3">
          <h1 className="text-[14px] font-semibold leading-5 tracking-[-0.14px]">
            Untitled chat
          </h1>
          <Star className="size-3.5 text-black/55" strokeWidth={2} />
        </div>
        <div className="flex items-center gap-3 text-black/55">
          <Plus className="size-4" strokeWidth={1.8} />
          <Clock3 className="size-4" strokeWidth={1.8} />
          <MoreVertical className="size-4" strokeWidth={1.8} />
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-[49px] shrink-0 items-center justify-between border-b border-[#e8e8ea] bg-white px-6 text-[#101112]">
      <div className="flex items-center gap-2">
        <House className="size-4" strokeWidth={1.9} />
        <h1 className="text-[18px] font-semibold leading-6 tracking-[-0.36px]">Chat</h1>
      </div>
      <div className="flex items-center gap-2 text-black/55">
        <CircleHelp className="size-4" strokeWidth={1.8} />
        <span className="text-[18px] font-semibold leading-6 tracking-[-0.18px]">
          Help
        </span>
      </div>
    </header>
  );
}

function Composer({ onSend, compact = false, disabled = false }) {
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div
      className={`relative flex flex-col bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] ${
        compact
          ? "h-[116px] w-[668px] rounded-[14px]"
          : "h-[154px] w-[716px] rounded-[14px]"
      }`}
    >
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder="Ask anything..."
        className={`w-full flex-1 resize-none bg-transparent text-[18px] font-medium leading-[22px] tracking-[-0.18px] text-[#101112] outline-none placeholder:text-black/45 disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? "px-5 py-4" : "px-5 py-4"
        }`}
      />
      <div className="flex h-11 items-end justify-end gap-1 p-2">
        <button
          type="button"
          className="flex h-7 w-[46.875px] items-center justify-center rounded-lg px-2 text-[14px] font-medium leading-5 tracking-[-0.14px] text-black/55"
        >
          Auto
        </button>
        <IconButton label="Insert prompt">
          <span className="text-[15px] font-semibold leading-none text-black/55">∕</span>
        </IconButton>
        <button
          type="button"
          onClick={submit}
          aria-label="Submit message"
          className="flex size-7 items-center justify-center rounded-lg bg-[#266df0] p-[7px] text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(38,109,240,0.24)] disabled:opacity-40"
          disabled={!value.trim() || disabled}
        >
          <ArrowUp className="size-3.5" strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}

function RecentChatComposer({ onSend, disabled = false }) {
  return (
    <div className="flex h-[186px] w-[716px] flex-col items-stretch justify-start">
      <a
        href="#chat"
        className="mb-[-12px] flex h-11 w-[716px] items-center gap-2 rounded-t-xl bg-[rgba(251,251,251,0.8)] px-3 pb-5 pt-2 text-[14px] font-medium leading-5 tracking-[-0.14px] text-black/55 transition-colors"
      >
        <Clock3 className="size-3.5 shrink-0" strokeWidth={1.8} />
        <span>Recent chat · </span>
        <span className="text-black/65">Untitled chat</span>
      </a>
      <Composer onSend={onSend} disabled={disabled} />
    </div>
  );
}

function ProviderMark({ label }) {
  return (
    <span className="grid size-4 place-items-center rounded bg-[#eef2ff] text-[10px] font-semibold text-[#266df0]">
      {label.slice(0, 1)}
    </span>
  );
}

function AccountButton({ children }) {
  return (
    <a
      href="#sync"
      className="flex h-8 items-center gap-2 whitespace-nowrap rounded-xl bg-white px-3 text-[14px] font-medium leading-5 tracking-[-0.14px] text-[#101112] shadow-[0_0_0_1px_rgba(28,40,64,0.08),0_2px_8px_rgba(28,40,64,0.08)]"
    >
      <ProviderMark label={children} />
      {children}
    </a>
  );
}

function MeetingsBlock() {
  return (
    <section className="flex h-[156px] w-[716px] flex-col gap-[10px]">
      <div className="flex h-5 w-[716px] items-center justify-between gap-3 px-[7px] pl-2">
        <h2 className="h-5 w-[61.0234px] text-[14px] font-medium leading-5 tracking-[-0.14px] text-black/60">
          Meetings
        </h2>
        <div className="flex h-5 w-[156.43px] items-center justify-start gap-0.5">
          <button className="h-5 w-[92px] whitespace-nowrap rounded-lg px-2 text-[14px] font-medium leading-5 tracking-[-0.14px] text-black/55">
            Today, Jun 20
          </button>
          <IconButton label="Previous day" className="size-5 rounded-md">
            <ChevronLeft className="size-3.5" strokeWidth={1.8} />
          </IconButton>
          <IconButton label="Next day" className="size-5 rounded-md">
            <ChevronRight className="size-3.5" strokeWidth={1.8} />
          </IconButton>
          <IconButton label="Meeting filters" className="size-5 rounded-md">
            <MoreVertical className="size-3.5" strokeWidth={1.8} />
          </IconButton>
        </div>
      </div>
      <div className="flex h-[126px] w-[716px] flex-col items-center justify-center gap-3">
        <div className="flex h-[38px] w-[279.469px] flex-col items-center justify-center gap-0.5">
          <p className="text-[16px] font-medium leading-5 tracking-[-0.16px] text-black/65">
            Turn meetings into opportunities
          </p>
          <p className="text-[14px] font-medium leading-5 tracking-[-0.14px] text-black/50">
            Sync your calendar to get instant meeting context
          </p>
        </div>
        <div className="flex h-8 w-[383.82px] items-center justify-start gap-2">
          <AccountButton>Connect calendar</AccountButton>
          <AccountButton>Connect inbox</AccountButton>
        </div>
      </div>
    </section>
  );
}

function TasksBlock() {
  return (
    <section className="flex h-28 w-[716px] flex-col gap-[10px]">
      <div className="flex h-5 w-[716px] items-center justify-between gap-3 px-[7px] pl-2">
        <div className="flex h-5 w-[49.9062px] items-baseline justify-start gap-1">
          <h2 className="text-[14px] font-medium leading-5 tracking-[-0.14px] text-black/60">
            Tasks
          </h2>
          <span className="text-[12px] font-medium leading-4 tracking-[-0.12px] text-black/45">
            0
          </span>
        </div>
        <button className="h-5 w-[55.4219px] rounded-lg text-[14px] font-medium leading-5 tracking-[-0.14px] text-black/55">
          View all
        </button>
      </div>
      <div className="relative h-[82px] w-[716px]">
        <div className="flex h-[82px] w-[716px] flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center justify-center gap-0.5">
            <p className="text-[16px] font-medium leading-5 tracking-[-0.16px] text-black/65">
              Stay on top of work
            </p>
            <p className="text-[14px] font-medium leading-5 tracking-[-0.14px] text-black/50">
              Create tasks for yourself or your team to track next steps
            </p>
          </div>
          <button className="flex h-8 items-center gap-2 rounded-xl bg-white px-3 text-[16px] font-medium leading-5 tracking-[-0.16px] text-[#101112] shadow-[0_0_0_1px_rgba(28,40,64,0.08),0_2px_8px_rgba(28,40,64,0.08)]">
            <Plus className="size-3.5" strokeWidth={1.9} />
            New task
          </button>
        </div>
      </div>
    </section>
  );
}

function HomeState({ onSend, disabled = false }) {
  return (
    <div className="h-[763px] w-[1165px] overflow-hidden overflow-y-auto text-[#101112]">
      <div className="table h-[686px] w-[1165px]">
        <div className="flex h-[686px] w-[1165px] flex-col items-center justify-stretch px-6 pb-14">
          <div className="mb-6 mt-12 flex h-6 w-[716px] max-w-[716px] flex-col items-start justify-start gap-1 px-2">
            <div className="h-6 w-[300px] whitespace-nowrap text-[20px] font-semibold leading-6 tracking-[-0.4px] text-[#101112]">
              Good morning, Daniel.
            </div>
          </div>
          <div className="flex h-[534px] w-[716px] max-w-[716px] flex-col items-stretch justify-start gap-10">
            <div className="flex h-[186px] w-[716px] flex-col items-stretch justify-start">
              <RecentChatComposer onSend={onSend} disabled={disabled} />
            </div>
            <div className="flex h-[308px] w-[716px] flex-col items-stretch justify-start gap-10">
              <MeetingsBlock />
              <TasksBlock />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantOverview() {
  return (
    <div className="text-[16px] font-medium leading-[27px] tracking-[-0.16px] text-[#101112]">
      <p className="mb-3">
        Hey Daniel! Here's a quick overview of what I can help you with in your client
        workspace:
      </p>
      {assistantSections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 font-semibold">{section.title}</p>
          <ul className="mb-3 list-disc space-y-0 pl-6 marker:text-black/65">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      <p>What would you like to do?</p>
    </div>
  );
}

function ChatThinkingIndicator() {
  return (
    <div className="flex h-9 items-center text-black/45">
      <DotmSquare6 size={28} dotSize={4} ariaLabel="Assistant is thinking" />
    </div>
  );
}

function ChatState({ messages, onSend, isThinking }) {
  const threadEndRef = useRef(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div className="flex h-[763px] w-[1165px] flex-col items-center justify-between text-[#101112]">
      <div className="flex h-[637px] w-[1165px] flex-col items-stretch justify-start">
        <div className="relative flex h-[637px] w-[1165px] flex-col items-stretch justify-stretch">
          <div className="relative flex h-[637px] w-[1165px] flex-col overflow-hidden">
            <div className="flex h-[637px] w-[1165px] flex-col overflow-hidden overflow-y-auto">
              <div className="flex min-h-full flex-col items-center justify-end">
                <div className="flex w-[700px] max-w-full flex-col items-stretch justify-start gap-6 px-6 py-8">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isThinking && (
                    <div className="flex gap-3">
                      <ChatThinkingIndicator />
                    </div>
                  )}
                  <div ref={threadEndRef} />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 flex h-7 w-[1165px] flex-col items-center justify-center pointer-events-none">
            <button className="flex size-7 items-center justify-center rounded-lg bg-white text-black/70 shadow-[0_0_0_1px_rgba(28,40,64,0.08),0_2px_8px_rgba(28,40,64,0.12)] pointer-events-auto">
              <ArrowDown className="size-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex h-[126px] w-[700px] max-w-full flex-col items-stretch justify-start px-4 pb-[10px]">
        <Composer onSend={onSend} compact disabled={isThinking} />
      </div>
    </div>
  );
}

export function ChatPanel() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  async function handleSend(text) {
    if (!text.trim() || isThinking) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setStarted(true);
    setIsThinking(true);

    try {
      const response = await api.sendChatMessage({ text, history: updatedMessages });
      if (response) {
        setMessages((prev) => [...prev, response]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: "Sorry, I had trouble processing that request. Please try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-white font-sans text-[#101112]">
      <TopBar mode={started ? "chat" : "home"} />
      <div className="min-h-0 flex-1 overflow-hidden">
        {started ? (
          <ChatState messages={messages} onSend={handleSend} isThinking={isThinking} />
        ) : (
          <HomeState onSend={handleSend} disabled={isThinking} />
        )}
      </div>
      <div className="fixed bottom-3 right-4 flex h-7 w-10 items-center rounded-full bg-[#47556d] p-0.5">
        <span className="block size-6 rounded-full bg-white shadow-sm" />
      </div>
    </div>
  );
}
