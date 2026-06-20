import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Brain,
  CalendarDays,
  ChevronDown,
  Copy,
  FileText,
  Mail,
  Mic,
  Paperclip,
  Plus,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UploadCloud,
  UserRound,
  X,
  Pencil,
  Send,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DotmSquare6 } from "@/components/ui/dotm-square-6";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerProfile } from "@/features/customers/CustomerProfile";
import { WorkflowDetails, WorkflowHeader } from "@/features/customers/WorkflowPanel";
import { cn } from "@/lib/utils";
import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";

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

function CustomerChatIconButton({ label, children, onClick, disabled, className = "" }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-7 items-center justify-center rounded-lg text-black/55 transition-colors hover:bg-black/[0.04] disabled:pointer-events-none disabled:opacity-35",
        className
      )}
    >
      {children}
    </button>
  );
}

function CustomerChatComposer({
  customer,
  value,
  onChange,
  onKeyDown,
  onSubmit,
  onAttach,
  onDraft,
  sending,
  model,
  onModelChange,
}) {
  const [open, setOpen] = useState(false);

  const modelLabels = {
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-reasoner": "DeepSeek Reasoner",
  };

  return (
    <div className="flex h-[140px] w-[700px] max-w-full flex-col items-stretch justify-start px-4 pb-[24px]">
      <div className="relative flex h-[116px] w-full flex-col rounded-[14px] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] focus-within:shadow-[inset_0_0_0_1px_rgba(38,109,240,0.28),0_8px_24px_rgba(28,40,64,0.08)]">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Ask about ${customer.name}...`}
          className="w-full flex-1 resize-none bg-transparent px-5 py-4 text-[15px] font-medium leading-5 text-[#101112] outline-none placeholder:text-black/45"
        />
        <div className="flex h-11 items-end justify-between gap-3 p-2">
          <div className="flex min-w-0 items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[13px] font-medium leading-5 text-[#266df0] hover:bg-black/[0.04] transition-colors"
              >
                <span>{modelLabels[model] || "Auto"}</span>
                <ChevronDown className="size-3 text-[#266df0]/70" />
              </button>

              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div className="absolute bottom-full left-0 mb-1.5 z-50 w-48 rounded-lg bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)] flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onModelChange("deepseek-chat");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-black/[0.04]",
                        model === "deepseek-chat" ? "text-[#266df0] bg-[#266df0]/[0.04]" : "text-black/75"
                      )}
                    >
                      DeepSeek Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onModelChange("deepseek-reasoner");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-black/[0.04]",
                        model === "deepseek-reasoner" ? "text-[#266df0] bg-[#266df0]/[0.04]" : "text-black/75"
                      )}
                    >
                      DeepSeek Reasoner
                    </button>
                  </div>
                </>
              )}
            </div>
            <CustomerChatIconButton label="Attach file" onClick={onAttach}>
              <Plus className="size-3.5" strokeWidth={1.9} />
            </CustomerChatIconButton>
            <button
              type="button"
              onClick={onAttach}
              className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium leading-5 text-black/55 transition-colors hover:bg-black/[0.04]"
            >
              <Paperclip className="size-3.5" strokeWidth={1.9} />
              Minutes
            </button>
            <button
              type="button"
              onClick={onDraft}
              disabled={sending}
              className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium leading-5 text-black/55 transition-colors hover:bg-black/[0.04] disabled:pointer-events-none disabled:opacity-35"
            >
              <Sparkles className="size-3.5" strokeWidth={1.9} />
              Draft
            </button>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            aria-label="Send message"
            disabled={!value.trim() || sending}
            className="flex size-7 items-center justify-center rounded-lg bg-[#266df0] p-[7px] text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(38,109,240,0.24)] transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="size-3.5" strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  );
}

function renderMessageText(text, isAssistant = false) {
  if (!text) return "";
  const parts = text.split("**");
  let wordIndex = 0;

  return parts.flatMap((part, partIndex) => {
    const isBold = partIndex % 2 === 1;
    const tokens = part.split(/(\s+)/);

    return tokens.map((token, tokenIndex) => {
      if (!token) return null;
      if (/^\s+$/.test(token)) {
        return <span key={`space-${partIndex}-${tokenIndex}`}>{token}</span>;
      }

      const currentWordIndex = wordIndex;
      wordIndex += 1;

      const style = isAssistant
        ? {
            animationDelay: `${currentWordIndex * 15}ms`,
          }
        : undefined;

      return (
        <span
          key={`word-${partIndex}-${tokenIndex}`}
          style={style}
          className={`${isBold ? "font-semibold" : ""} ${
            isAssistant ? "inline-block animate-grok-fade opacity-0" : ""
          }`}
        >
          {token}
        </span>
      );
    });
  });
}

function parseEmailDraft(text) {
  if (!text) return null;

  const lines = text.split("\n");
  let subjectLineIndex = -1;
  let subjectText = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(/^(?:\*\*|\*|)?Subject(?:\*\*|\*|)?:\s*(.+)$/i);
    if (match) {
      subjectLineIndex = i;
      subjectText = match[1].replace(/[\*\_\#]+/g, "").trim();
      break;
    }
  }

  if (subjectLineIndex === -1) return null;

  const preText = lines.slice(0, subjectLineIndex).join("\n").trim();
  const bodyLines = lines.slice(subjectLineIndex + 1);
  let bodyText = bodyLines.join("\n").trim();

  let postText = "";
  const sourcesIndex = bodyText.search(/\n\s*(?:Sources|Source):\s*/i);
  if (sourcesIndex !== -1) {
    postText = bodyText.substring(sourcesIndex).trim();
    bodyText = bodyText.substring(0, sourcesIndex).trim();
  }

  return {
    preText,
    subject: subjectText,
    body: bodyText,
    postText,
  };
}

function formatBodyToHtml(rawText) {
  if (!rawText) return "";

  const paragraphs = rawText.split(/\n\n+/);

  return paragraphs
    .map((p) => {
      let escaped = p
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      escaped = escaped.replace(/\[([^\]]+)\]/g, (match) => {
        return `<span class="text-[#0d0d0d] bg-[#266df0]/10 border border-[#266df0]/20 cursor-text rounded-md px-1 py-0.5 font-medium select-all">${match}</span>`;
      });

      escaped = escaped.replace(/\n/g, "<br />");

      return `<p class="mb-4 last:mb-0 leading-[26px]">${escaped}</p>`;
    })
    .join("");
}

function EmailDraftBlock({ initialSubject, initialBody }) {
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);

  return (
    <div className="my-4 w-[768px] max-w-full font-sans text-left">
      <div className="relative isolate w-full overflow-clip rounded-[24px] border border-black/[0.06] bg-white shadow-[0px_4px_80px_rgba(0,0,0,0.02)] h-[559px] flex flex-col">
        {/* Subject */}
        <div className="pt-6 pb-3 pr-10 pl-5 shrink-0">
          <div className="grid">
            <textarea
              ref={subjectRef}
              defaultValue={initialSubject}
              className="col-start-1 col-end-2 row-start-1 row-end-2 w-full resize-none overflow-hidden p-0 border-none bg-transparent text-[22px] font-semibold text-[#0d0d0d] leading-normal placeholder:text-[#9b9b9b] focus:ring-0 focus:outline-hidden"
              aria-label="Subject"
              rows={1}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t-[0.5px] border-black/[0.08] mx-5 my-0" />

        {/* Body Editor */}
        <div className="flex-1 overflow-y-auto pt-4 pb-4 pr-10 pl-5 min-h-0">
          <div
            ref={bodyRef}
            contentEditable
            suppressContentEditableWarning
            className="ProseMirror w-full break-words focus:outline-none text-[15px] leading-[26px] text-[#0d0d0d] font-sans"
            dangerouslySetInnerHTML={{ __html: formatBodyToHtml(initialBody) }}
          />
        </div>
      </div>
    </div>
  );
}

function CustomerChatMessage({ message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-xl bg-[#f1f1f1] px-3.5 py-2 text-[14px] font-normal leading-5 text-[#101112]">
          {renderMessageText(message.text, false)}
        </div>
      </div>
    );
  }

  const parsedDraft = parseEmailDraft(message.text);
  if (parsedDraft) {
    const finalPreText = parsedDraft.preText || `Here is the drafted email for this customer:`;
    return (
      <div className="group flex flex-col gap-1 w-full items-start">
        {finalPreText && (
          <div className="whitespace-pre-wrap text-[14px] font-normal leading-6 text-[#101112] w-full mb-2">
            {renderMessageText(finalPreText, message.id !== "seed-1")}
          </div>
        )}

        <div className="w-[768px] h-[605px] max-w-full flex flex-col">
          <EmailDraftBlock
            initialSubject={parsedDraft.subject}
            initialBody={parsedDraft.body}
          />
        </div>

        {parsedDraft.postText && (
          <div className="mt-2 text-[12px] text-black/45 italic">
            {parsedDraft.postText}
          </div>
        )}

        <div className="mt-1 flex h-7 items-center justify-start gap-1 text-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          <CustomerChatIconButton label="Copy">
            <Copy className="size-3.5" strokeWidth={1.8} />
          </CustomerChatIconButton>
          <CustomerChatIconButton label="Helpful">
            <ThumbsUp className="size-3.5" strokeWidth={1.8} />
          </CustomerChatIconButton>
          <CustomerChatIconButton label="Not helpful">
            <ThumbsDown className="size-3.5" strokeWidth={1.8} />
          </CustomerChatIconButton>
          <CustomerChatIconButton label="Try again">
            <RotateCcw className="size-3.5" strokeWidth={1.8} />
          </CustomerChatIconButton>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="whitespace-pre-wrap text-[14px] font-normal leading-6 text-[#101112]">
        {renderMessageText(message.text, message.id !== "seed-1")}
      </div>
      <div className="mt-1 flex h-7 items-center justify-start gap-1 text-black/45 opacity-0 transition-opacity group-hover:opacity-100">
        <CustomerChatIconButton label="Copy">
          <Copy className="size-3.5" strokeWidth={1.8} />
        </CustomerChatIconButton>
        <CustomerChatIconButton label="Helpful">
          <ThumbsUp className="size-3.5" strokeWidth={1.8} />
        </CustomerChatIconButton>
        <CustomerChatIconButton label="Not helpful">
          <ThumbsDown className="size-3.5" strokeWidth={1.8} />
        </CustomerChatIconButton>
        <CustomerChatIconButton label="Try again">
          <RotateCcw className="size-3.5" strokeWidth={1.8} />
        </CustomerChatIconButton>
      </div>
    </div>
  );
}

function CustomerChatThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-[13px] font-medium leading-6 text-[#266df0]">
      <DotmSquare6 size={26} dotSize={4} ariaLabel="Assistant is thinking" />
      <span>Searching saved memory...</span>
    </div>
  );
}

export function CustomerWorkspace() {
  const { customerId } = useParams();
  const { data: fetchedCustomer, loading, error } = useApi(() => api.getCustomerById(customerId), [customerId]);
  const { data: fetchedMemories } = useApi(() => api.getCustomerMemories(customerId), [customerId]);
  const { data: fetchedConfig } = useApi(() => api.getWorkflowConfig(customerId), [customerId]);
  const customer = fetchedCustomer;
  const inputRef = useRef(null);
  const threadEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const configSaveTimer = useRef(null);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");
  const [files, setFiles] = useState([]);
  const [memories, setMemories] = useState([]);
  const [workflowConfig, setWorkflowConfig] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [savingMemory, setSavingMemory] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");

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
    if (fetchedConfig) setWorkflowConfig(fetchedConfig);
  }, [fetchedConfig]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    return () => clearTimeout(configSaveTimer.current);
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending]);

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



  // Update workflow config in state immediately (so the chat uses the latest)
  // and debounce the persistence so we don't write on every keystroke.
  function updateWorkflowConfig(next) {
    setWorkflowConfig(next);
    clearTimeout(configSaveTimer.current);
    configSaveTimer.current = setTimeout(() => {
      api.saveWorkflowConfig(customer.id, next);
    }, 600);
  }

  async function draftFollowUp() {
    if (!customer || sending) return;

    const prompt = "Draft a follow-up email from this customer's latest memory.";
    setSending(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: prompt }]);

    try {
      const reply = await api.draftCustomerFollowUp({ customer, memories, workflowConfig, model: selectedModel });
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
      const reply = await api.sendCustomerMessage({ customer, text, memories, history: messages, workflowConfig, model: selectedModel });
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

      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_410px]">
        <section className="relative flex min-h-0 flex-col overflow-hidden border-r bg-white text-[#101112]">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex min-h-full flex-col items-center justify-end">
              <div className="flex w-[700px] max-w-full flex-col items-stretch justify-start gap-10 px-6 py-8">
                {messages.map((message) => (
                  <CustomerChatMessage key={message.id} message={message} />
                ))}
                {sending && <CustomerChatThinkingIndicator />}
                <div ref={threadEndRef} />
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-[170px] left-0 right-0 flex h-7 items-center justify-center">
            <button
              type="button"
              aria-label="Scroll to latest message"
              onClick={() => threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })}
              className="pointer-events-auto flex size-7 items-center justify-center rounded-lg bg-white text-black/70 opacity-0 shadow-[0_0_0_1px_rgba(28,40,64,0.08),0_2px_8px_rgba(28,40,64,0.12)] transition-opacity hover:opacity-100 focus:opacity-100"
            >
              <ArrowDown className="size-3.5" strokeWidth={1.8} />
            </button>
          </div>
          <div className="flex shrink-0 justify-center bg-white">
            <CustomerChatComposer
              customer={customer}
              value={value}
              onChange={setValue}
              onKeyDown={onKeyDown}
              onSubmit={submit}
              onAttach={() => inputRef.current?.click()}
              onDraft={draftFollowUp}
              sending={sending}
              model={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto bg-white">
          <WorkflowHeader customer={customer} />
          <CustomerProfile customer={customer} />

          <Tabs defaultValue="details" className="gap-0 px-6 pb-8 pt-4">
            <TabsList
              variant="ghost"
              className="w-full justify-start gap-6 border-b border-[#ededed] bg-transparent p-0 [&_[data-slot=tab-indicator]]:hidden"
            >
              <TabsTrigger
                value="details"
                className="h-10 rounded-none border-b-2 border-transparent px-0 text-[15px] font-medium text-[#9a9aa0] focus-visible:ring-0 focus-visible:ring-offset-0 data-active:border-[#266df0] data-active:bg-transparent data-active:text-[#266df0]"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="h-10 rounded-none border-b-2 border-transparent px-0 text-[15px] font-medium text-[#9a9aa0] focus-visible:ring-0 focus-visible:ring-offset-0 data-active:border-[#266df0] data-active:bg-transparent data-active:text-[#266df0]"
              >
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="pt-1">
              {workflowConfig ? (
                <WorkflowDetails config={workflowConfig} onChange={updateWorkflowConfig} customerId={customer.id} />
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">Loading workflow…</div>
              )}
            </TabsContent>

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
