import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp,
  Brain,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";

const STATUS_STYLE = {
  Monitoring: "bg-[#eef0f2] text-[#5b616b]",
  "Action needed": "bg-[#fdeaea] text-[#d4351c]",
  Scheduled: "bg-[rgba(38,109,240,0.1)] text-[rgb(38,109,240)]",
  Lead: "bg-[#eef0f2] text-[#5b616b]",
  Won: "bg-[#eef0f2] text-[#5b616b]",
  Qualified: "bg-[rgba(38,109,240,0.1)] text-[rgb(38,109,240)]",
  Proposal: "bg-[rgba(38,109,240,0.1)] text-[rgb(38,109,240)]",
  Negotiation: "bg-[#fdeaea] text-[#d4351c]",
  "Churn-risk": "bg-[#fdeaea] text-[#d4351c]",
};

const ACTION_WORDS = [
  "action",
  "ask",
  "budget",
  "concern",
  "deadline",
  "demo",
  "follow",
  "meeting",
  "need",
  "next",
  "renew",
  "risk",
  "schedule",
  "want",
];

function formatFileSize(size) {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMemoryDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function cleanText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function compactPhoneNumber(value) {
  return String(value ?? "").replace(/[^\d+]/g, "");
}

function formatCalendarDate(date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function getScheduleUrl(customer) {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${customer.name} follow-up`,
    details: `Next step: ${customer.task || customer.nextAction || "Confirm next action"}`,
    dates: `${formatCalendarDate(start)}/${formatCalendarDate(end)}`,
  });

  if (customer.email?.includes("@")) params.set("add", customer.email);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function summarizeText(rawText, fallback) {
  const text = cleanText(rawText);
  if (!text) return fallback;

  const sentences = text
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((sentence) => cleanText(sentence))
    .filter(Boolean) ?? [text];

  const priority = sentences.find((sentence) => {
    const lower = sentence.toLowerCase();
    return ACTION_WORDS.some((word) => lower.includes(word));
  });
  const picked = [priority ?? sentences[0], ...sentences.filter((sentence) => sentence !== priority).slice(0, 1)];
  const summary = cleanText(picked.join(" "));

  if (summary.length <= 280) return summary;
  return `${summary.slice(0, 280).replace(/\s+\S*$/, "")}...`;
}

function isTextLikeFile(file) {
  return (
    file.type?.startsWith("text/") ||
    ["application/json", "application/xml", "application/csv"].includes(file.type) ||
    /\.(txt|md|csv|json|log)$/i.test(file.name)
  );
}

async function readFileText(file) {
  if (!isTextLikeFile(file)) return "";
  try {
    return (await file.text()).slice(0, 24000);
  } catch {
    return "";
  }
}

export function CustomerWorkspace() {
  const { customerId } = useParams();
  const { data: fetchedCustomer, loading, error } = useApi(() => api.getCustomerById(customerId), [customerId]);
  const { data: fetchedMemories } = useApi(() => api.getCustomerMemories(customerId), [customerId]);
  const customer = fetchedCustomer;
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");
  const [files, setFiles] = useState([]);
  const [memories, setMemories] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [savingMemory, setSavingMemory] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setMessages([
      {
        id: "seed-1",
        role: "assistant",
        text: `I have ${customer.name}'s account context ready. Ask for a recap, renewal plan, risk summary, or follow-up email.`,
      },
    ]);
  }, [customer?.id]);

  useEffect(() => {
    if (fetchedMemories) setMemories(fetchedMemories);
  }, [fetchedMemories]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  if (loading && !customer) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-5">
          <Button variant="ghost" size="icon-sm" render={<Link to="/customers" />} aria-label="Back to customers">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">Loading customer</h1>
            <p className="text-[11px] text-muted-foreground">Fetching live customer data...</p>
          </div>
        </header>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-5">
          <Button variant="ghost" size="icon-sm" render={<Link to="/customers" />} aria-label="Back to customers">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">Could not load customer</h1>
            <p className="text-[11px] text-muted-foreground">Supabase returned an error for this customer.</p>
          </div>
        </header>
      </div>
    );
  }

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

  function buildMemoryEntry({ kind, title, body, sourceName, sourceMeta }) {
    const fallback =
      kind === "file"
        ? `Uploaded ${sourceName}. Text extraction is not available for this file type yet, but the document is saved as client context.`
        : "Saved client note for future chatbot context.";

    return {
      id: `${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind,
      title,
      summary: summarizeText(body, fallback),
      sourceName,
      sourceMeta,
      createdAt: new Date().toISOString(),
    };
  }

  async function remember(entry) {
    setMemories((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)]);
    const savedEntry = await api.saveCustomerMemory(customer.id, entry);
    setMemories((prev) => [savedEntry, ...prev.filter((item) => item.id !== savedEntry.id)]);
    setMessages((prev) => [
      ...prev,
      {
        id: `memory-${savedEntry.id}`,
        role: "assistant",
        text: `Saved to ${customer.name}'s memory:\n\n${savedEntry.summary}`,
      },
    ]);
  }

  async function addFiles(fileList) {
    const next = Array.from(fileList ?? []).map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      size: file.size,
      type: file.type || "Document",
      file,
    }));
    const currentIds = new Set(files.map((file) => file.id));
    const freshFiles = next.filter((file) => !currentIds.has(file.id));
    if (!freshFiles.length) return;

    setFiles((prev) => {
      const seen = new Set(prev.map((file) => file.id));
      return [
        ...prev,
        ...freshFiles
          .filter((file) => !seen.has(file.id))
          .map(({ file, ...upload }) => upload),
      ];
    });

    setSavingMemory(true);
    try {
      for (const upload of freshFiles) {
        const body = await readFileText(upload.file);
        await remember(
          buildMemoryEntry({
            kind: "file",
            title: upload.name,
            body,
            sourceName: upload.name,
            sourceMeta: `${formatFileSize(upload.size)} | ${isTextLikeFile(upload.file) ? "Summarized" : "Stored reference"}`,
          })
        );
      }
    } finally {
      setSavingMemory(false);
    }
  }

  async function saveNoteMemory() {
    const body = noteText.trim();
    if (!body || !customer) return;
    setSavingMemory(true);
    try {
      await remember(
        buildMemoryEntry({
          kind: "voice",
          title: "Voice or typed note",
          body,
          sourceName: "Advisor note",
          sourceMeta: "Summarized",
        })
      );
      setNoteText("");
      setVoiceError("");
    } finally {
      setSavingMemory(false);
    }
  }

  function startVoiceCapture() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice capture is not supported in this browser. Paste the note and summarize it instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          transcript += `${event.results[index][0].transcript} `;
        }
      }
      if (transcript.trim()) {
        setNoteText((prev) => cleanText(`${prev} ${transcript}`));
      }
    };
    recognition.onerror = () => {
      setVoiceError("Could not capture audio. Paste the note and summarize it instead.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setVoiceError("");
    setListening(true);
  }

  function stopVoiceCapture() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function addAssistantNotice(text) {
    setMessages((prev) => [
      ...prev,
      {
        id: `notice-${Date.now()}`,
        role: "assistant",
        text,
      },
    ]);
  }

  function callCustomer() {
    const phone = compactPhoneNumber(customer.phone);
    if (phone) {
      window.location.href = `tel:${phone}`;
      return;
    }

    if (customer.email?.includes("@")) {
      window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(`Follow-up with ${customer.name}`)}`;
      return;
    }

    addAssistantNotice(`No phone or email is saved for ${customer.name}. Add contact details before starting outreach.`);
  }

  async function draftFollowUp() {
    if (!customer || sending) return;

    const prompt = "Draft a follow-up email from this customer's latest memory.";
    setSending(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: prompt }]);

    try {
      const reply = await api.draftCustomerFollowUp({ customer, memories });
      if (reply) setMessages((prev) => [...prev, reply]);
    } catch {
      addAssistantNotice("I could not draft a follow-up right now. Try again after saving the latest client memory.");
    } finally {
      setSending(false);
    }
  }

  async function submit() {
    const text = value.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setValue("");
    setSending(true);

    try {
      const reply = await api.sendCustomerMessage({ customer, text, memories });
      if (reply) setMessages((prev) => [...prev, reply]);
    } catch {
      addAssistantNotice("I could not search this customer record right now. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  const activityItems = memories.slice(0, 6).map((memory) => {
    const ActivityIcon = memory.kind === "file" ? FileText : memory.kind === "meeting" ? CalendarDays : Brain;
    const typeLabel = memory.kind === "file" ? "Document" : memory.kind === "meeting" ? "Meeting" : "Note";

    return {
      ...memory,
      ActivityIcon,
      typeLabel,
    };
  });

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
          <Button variant="outline" size="sm" onClick={callCustomer}>
            <Phone className="size-4" /> Call
          </Button>
          <Button size="sm" render={<a href={getScheduleUrl(customer)} target="_blank" rel="noreferrer" />}>
            <CalendarDays className="size-4" /> Schedule
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_410px]">
        <section className="flex min-h-0 flex-col border-r">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-5 px-6 py-8">
              <div className="mb-auto flex max-w-sm flex-col gap-3 pt-8 text-sm">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-foreground">Ask about this customer</h2>
                  <p className="mt-1 text-muted-foreground">
                    Use saved interactions, documents, and account details to prepare recaps, next steps, and follow-up drafts.
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
                {sending && (
                  <div className="flex gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Bot className="size-4" />
                    </span>
                    <div className="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-muted-foreground">
                      Searching saved memory...
                    </div>
                  </div>
                )}
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
                  <Button variant="outline" size="sm" onClick={draftFollowUp} loading={sending}>
                    <Sparkles className="size-4" /> Draft
                  </Button>
                </div>
                <Button size="icon-sm" onClick={submit} disabled={!value.trim() || sending} loading={sending} aria-label="Send message">
                  <ArrowUp className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto bg-[#fbfbfc]">
          <div className="px-6 pb-4 pt-7">
            <div className="flex items-start gap-4">
              <span
                className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold text-white"
                style={{ backgroundColor: customer.accent }}
              >
                {customer.avatar}
              </span>
              <div className="min-w-0 pt-1">
                <h2 className="truncate text-2xl font-semibold tracking-[-0.02em]">{customer.name}</h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">{customer.contact || customer.email}</p>
                <span className={cn("mt-3 inline-flex rounded-md px-2 py-0.5 text-xs font-medium", STATUS_STYLE[customer.status])}>
                  {customer.status}
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="activity" className="gap-0 px-6 pb-6">
            <TabsList variant="ghost" className="border-b bg-transparent p-0">
              <TabsTrigger
                value="activity"
                className="h-10 rounded-none border-b-2 border-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 data-active:border-primary data-active:bg-transparent"
              >
                Activity log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="pt-5">
              <div className="grid grid-cols-2 gap-2">
                <CustomerFact icon={Mail} label="Email" value={customer.email || "No email"} />
                <CustomerFact icon={UserRound} label="Owner" value="Ferdinand" />
                <CustomerFact icon={CalendarDays} label="Last touch" value={customer.lastTouch || "Not recorded"} />
                <CustomerFact icon={FileText} label="Next step" value={customer.task || customer.nextAction || "Confirm next action"} />
              </div>

              <div className="mt-5 rounded-lg border bg-white p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Brain className="size-4 text-primary" />
                  Add client note
                </div>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  rows={4}
                  placeholder="Paste a call note, family update, preference, or commitment..."
                  className="w-full resize-none rounded-md border bg-white px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant={listening ? "secondary" : "outline"}
                    size="sm"
                    onClick={listening ? stopVoiceCapture : startVoiceCapture}
                  >
                    <Mic className="size-4" /> {listening ? "Stop" : "Dictate"}
                  </Button>
                  <Button size="sm" onClick={saveNoteMemory} disabled={!noteText.trim() || savingMemory}>
                    <FileText className="size-4" /> Save note
                  </Button>
                </div>
                {voiceError && <p className="mt-2 text-xs text-destructive-foreground">{voiceError}</p>}
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Recent interactions</h3>
                  <span className="text-xs text-muted-foreground">{activityItems.length} saved</span>
                </div>
                <div className="space-y-3">
                  {activityItems.map(({ ActivityIcon, typeLabel, ...memory }) => (
                    <div key={memory.id} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                      <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <ActivityIcon className="size-4" />
                      </span>
                      <div className="border-b pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{memory.title}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {typeLabel} | {memory.sourceName} | {formatMemoryDate(memory.createdAt)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            {memory.sourceMeta || "Saved"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{memory.summary}</p>
                      </div>
                    </div>
                  ))}
                  {!activityItems.length && (
                    <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
                      No client interactions saved yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5">
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
                    "flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed bg-white px-4 py-5 text-center transition-colors",
                    dragging ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <UploadCloud className="size-5 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">Add transcript or document</p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT, or notes from a client call</p>
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
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

function CustomerFact({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-lg border bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
