import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp,
  Bot,
  CalendarDays,
  FileText,
  Mail,
  Mic,
  Paperclip,
  Phone,
  Plus,
  Sparkles,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCustomerById } from "@/data/customers";

const STATUS_STYLE = {
  Monitoring: "bg-[#eef0f2] text-[#5b616b]",
  "Action needed": "bg-[#fdeaea] text-[#d4351c]",
  Scheduled: "bg-[rgba(38,109,240,0.1)] text-[rgb(38,109,240)]",
};

const CONTEXT_SUMMARIES = [
  "Annual review call focused on renewal readiness, premium sensitivity, and confirming the beneficiary sequence before the next policy cycle.",
  "Customer asked for clearer follow-up timing and wants a concise pre-call summary before committing to the proposed schedule.",
  "Advisor noted that family trust changes may affect the policy review order and should be checked before drafting the next recommendation.",
];

function formatFileSize(size) {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildAssistantReply(customer, text, files) {
  const contextLine = files.length
    ? `I will use ${files.length} uploaded meeting-minute file${files.length === 1 ? "" : "s"} as context.`
    : "No meeting-minute files are attached yet, so this is based on the saved account context.";

  return {
    id: `a-${Date.now()}`,
    role: "assistant",
    text: `${contextLine}\n\nFor ${customer.name}, I would focus the next response on: ${customer.task}. A useful next step is to draft a short recap, confirm open questions, and propose one concrete meeting time.`,
  };
}

export function CustomerWorkspace() {
  const { customerId } = useParams();
  const location = useLocation();
  const routedCustomer = location.state?.customer;
  const customer = routedCustomer?.id && String(routedCustomer.id) === String(customerId)
    ? routedCustomer
    : getCustomerById(customerId);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState(() => [
    {
      id: "seed-1",
      role: "assistant",
      text: customer
        ? `I have ${customer.name}'s account context ready. Ask for a recap, renewal plan, risk summary, or follow-up email.`
        : "I could not find that customer.",
    },
  ]);
  const [value, setValue] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);

  const discussions = useMemo(() => {
    if (!customer) return [];
    return CONTEXT_SUMMARIES.map((text, index) => ({
      id: `${customer.id}-${index}`,
      title: index === 0 ? "Renewal review" : index === 1 ? "Follow-up preference" : "Trust context",
      date: index === 0 ? "Jun 12" : index === 1 ? "May 28" : "May 03",
      text,
    }));
  }, [customer]);

  if (!customer) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-5">
          <Button variant="ghost" size="icon-sm" render={<Link to="/customers" />} aria-label="Back to customers">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">Customer not found</h1>
            <p className="text-[11px] text-muted-foreground">Return to Customer Hub</p>
          </div>
        </header>
      </div>
    );
  }

  function addFiles(fileList) {
    const next = Array.from(fileList ?? []).map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      size: file.size,
      type: file.type || "Document",
    }));
    setFiles((prev) => {
      const seen = new Set(prev.map((file) => file.id));
      return [...prev, ...next.filter((file) => !seen.has(file.id))];
    });
  }

  function submit() {
    const text = value.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text },
      buildAssistantReply(customer, text, files),
    ]);
    setValue("");
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link to="/customers" />} aria-label="Back to customers">
            <ArrowLeft className="size-4" />
          </Button>
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-[7px] text-xs font-semibold text-white"
            style={{ backgroundColor: customer.accent }}
          >
            {customer.avatar}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{customer.name}</h1>
            <p className="truncate text-[11px] text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Phone className="size-4" /> Call
          </Button>
          <Button size="sm">
            <CalendarDays className="size-4" /> Schedule
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_410px]">
        <section className="flex min-h-0 flex-col border-r">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-5 px-6 py-8">
              <div className="mb-auto flex max-w-sm flex-col gap-3 pt-8 text-sm">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-foreground">Ask about this customer</h2>
                  <p className="mt-1 text-muted-foreground">
                    Use saved account details and uploaded meeting minutes to prepare recaps, next steps, and follow-up drafts.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" && "justify-end"
                    )}
                  >
                    {message.role !== "user" && (
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Bot className="size-4" />
                      </span>
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        message.role === "user"
                          ? "rounded-br-md bg-secondary text-secondary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 bg-white px-5 pb-4">
            <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-2 shadow-xs/5 focus-within:ring-2 focus-within:ring-ring/40">
              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={onKeyDown}
                rows={3}
                placeholder={`Ask about ${customer.name}...`}
                className="max-h-40 w-full resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between gap-3 px-1 pt-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Button variant="outline" size="icon-sm" onClick={() => inputRef.current?.click()} aria-label="Attach meeting minutes">
                    <Plus className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    <Paperclip className="size-4" /> Minutes
                  </Button>
                  <Button variant="outline" size="sm">
                    <Sparkles className="size-4" /> Draft
                  </Button>
                </div>
                <Button size="icon-sm" onClick={submit} disabled={!value.trim()} aria-label="Send message">
                  <ArrowUp className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto bg-[#fbfbfc]">
          <div className="px-6 py-7">
            <div className="flex items-start gap-4">
              <span
                className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold text-white"
                style={{ backgroundColor: customer.accent }}
              >
                {customer.avatar}
              </span>
              <div className="min-w-0 pt-1">
                <h2 className="truncate text-2xl font-semibold tracking-[-0.02em]">{customer.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Customer workspace</p>
                <span className={cn("mt-3 inline-flex rounded-md px-2 py-0.5 text-xs font-medium", STATUS_STYLE[customer.status])}>
                  {customer.status}
                </span>
              </div>
            </div>
          </div>

          <DetailSection title="Details">
            <DetailRow icon={Mail} label="Email" value={customer.email || "No email"} />
            <DetailRow icon={UserRound} label="Owner" value="Ferdinand" />
            <DetailRow icon={CalendarDays} label="Next step" value={customer.task} />
          </DetailSection>

          <DetailSection title="Meeting Minutes">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer.files);
              }}
              className={cn(
                "flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-white px-4 py-5 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <UploadCloud className="size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Drop meeting minutes here</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT, or notes from customer calls</p>
              <Button className="mt-4" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <Paperclip className="size-4" /> Choose files
              </Button>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={(event) => addFiles(event.target.files)}
              />
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((item) => item.id !== file.id))}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

          <DetailSection title="Previous Discussions">
            <div className="space-y-3">
              {discussions.map((discussion) => (
                <div key={discussion.id} className="border-l-2 border-primary/25 pl-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{discussion.title}</p>
                    <span className="text-[11px] text-muted-foreground">{discussion.date}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{discussion.text}</p>
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection title="Voice Notes">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-3 text-left transition-colors hover:bg-secondary/50"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Mic className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Capture call note</span>
                <span className="block truncate text-xs text-muted-foreground">Add voice context before the next reply</span>
              </span>
            </button>
          </DetailSection>
        </aside>
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="border-t px-6 py-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3 py-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <span>{label}</span>
      </div>
      <p className="min-w-0 leading-relaxed text-foreground">{value}</p>
    </div>
  );
}
