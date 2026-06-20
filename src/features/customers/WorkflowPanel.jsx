import { useState } from "react";
import { ChevronUp, Code, Info, MoreHorizontal, Plus, Waypoints } from "lucide-react";
import { DotmSquare6 } from "@/components/ui/dotm-square-6";
import { cn } from "@/lib/utils";

/* Notion-like workflow configuration panel. Replicates the agent settings layout:
   a pixel app icon, title + status, owner row, action buttons, and a stack of
   collapsible sections (Instructions, Guardrails, Tone, Knowledge, Tools). */

const ACCENT = "#f0641e"; // orange used for active toggles + connect link

function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors duration-150",
        checked ? "bg-[#f0641e]" : "bg-[#e3e3e6]",
        disabled && "cursor-not-allowed opacity-50"
      )}
      style={checked ? { backgroundColor: ACCENT } : undefined}
    >
      <span
        className={cn(
          "inline-block size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-150",
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}

function Section({ label, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-[#ededed] py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[#1a1a1a]">{label}</h3>
        <div className="flex items-center gap-1.5 text-[#bdbdc2]">
          <button
            type="button"
            aria-label={`About ${label}`}
            className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-black/[0.04]"
          >
            <Info className="size-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
            onClick={() => setOpen((value) => !value)}
            className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-black/[0.04]"
          >
            <ChevronUp className={cn("size-4 transition-transform duration-150", !open && "rotate-180")} strokeWidth={2} />
          </button>
        </div>
      </div>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

function WorkdayLogo() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-[#f5a623] text-[11px] font-bold lowercase text-white">
      w
    </span>
  );
}

function DriveLogo() {
  return (
    <svg viewBox="0 0 87.3 78" className="size-[18px] shrink-0" aria-hidden="true">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  );
}

function SlackLogo() {
  return (
    <svg viewBox="0 0 122.8 122.8" className="size-[18px] shrink-0" aria-hidden="true">
      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9z" fill="#e01e5a" />
      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9z" fill="#36c5f0" />
      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9z" fill="#2eb67d" />
      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9z" fill="#ecb22e" />
    </svg>
  );
}

export function WorkflowHeader() {
  return (
    <div className="px-6 pt-7">
      <div className="flex size-[68px] items-center justify-center rounded-[20px] bg-[#b6e84f]">
        <DotmSquare6 size={42} dotSize={5} dotShape="square" pattern="full" color="#1d4ed8" ariaLabel="Workflow icon" />
      </div>

      <h1 className="mt-5 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#1a1a1a]">
        Resume Review
      </h1>
      <p className="mt-1.5 text-[15px] text-[#9a9aa0]">Drafting completed - awaiting approval</p>

      <div className="mt-3.5 flex items-center gap-2 text-[14px] text-[#3f3f46]">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#d97757] text-[10px] font-semibold text-white">
          G
        </span>
        <span>Managed by Gregor</span>
        <span className="ml-0.5 inline-flex items-center gap-1 rounded-md bg-[#f1f1f3] px-2 py-0.5 text-[13px] text-[#6b6b70]">
          <span className="text-[#a0a0a6]">#</span> HR
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#1a1a1a] px-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[#000]"
        >
          <Waypoints className="size-4" strokeWidth={1.9} />
          Manage workflow
        </button>
        <button
          type="button"
          aria-label="More options"
          className="flex size-9 items-center justify-center rounded-[10px] bg-[#f1f1f3] text-[#3f3f46] transition-colors hover:bg-[#e8e8ec]"
        >
          <MoreHorizontal className="size-4.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function WorkflowDetails() {
  const [knowledge, setKnowledge] = useState({ workday: true, drive: false, slack: true });
  const [tools, setTools] = useState({ code: true });

  return (
    <div className="text-[#2a2a2e]">
      <Section label="Instructions">
        <div className="space-y-2.5 text-[15px] leading-[1.55]">
          <p># Data Analysis</p>
          <p>
            Analyze and plot this data thoroughly and give me key figures like mean, median and standard
            deviation.
          </p>
        </div>
      </Section>

      <Section label="Guardrails">
        <p className="text-[15px] leading-[1.55]">You only discuss topics related to tutoring.</p>
      </Section>

      <Section label="Tone">
        <p className="text-[15px] italic text-[#b0b0b6]">Type I.e. Casual, Detailed, Humorous, Objective, etc..</p>
      </Section>

      <Section label="Knowledge">
        <div className="-mt-1">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5">
              <WorkdayLogo />
              <span className="text-[15px]">Workday</span>
            </div>
            <Toggle
              label="Workday"
              checked={knowledge.workday}
              onChange={(value) => setKnowledge((state) => ({ ...state, workday: value }))}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <DriveLogo />
              <span className={cn("text-[15px]", knowledge.drive ? "" : "italic text-[#a0a0a6]")}>Google Drive</span>
              {!knowledge.drive && (
                <>
                  <span className="text-[#cfcfd4]">•</span>
                  <button
                    type="button"
                    onClick={() => setKnowledge((state) => ({ ...state, drive: true }))}
                    className="text-[14px] font-medium text-[#f0641e] hover:underline"
                  >
                    Connect Account
                  </button>
                </>
              )}
            </div>
            <Toggle
              label="Google Drive"
              checked={knowledge.drive}
              disabled={!knowledge.drive}
              onChange={(value) => setKnowledge((state) => ({ ...state, drive: value }))}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5">
              <SlackLogo />
              <span className="text-[15px]">Slack</span>
            </div>
            <Toggle
              label="Slack"
              checked={knowledge.slack}
              onChange={(value) => setKnowledge((state) => ({ ...state, slack: value }))}
            />
          </div>

          <button
            type="button"
            className="mt-1 flex items-center gap-2 py-1.5 text-[15px] text-[#6b6b70] transition-colors hover:text-[#1a1a1a]"
          >
            <Plus className="size-4" strokeWidth={2} />
            Add connection
          </button>
        </div>
      </Section>

      <Section label="Tools">
        <div className="-mt-1">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5">
              <Code className="size-[18px] text-[#3f3f46]" strokeWidth={1.9} />
              <span className="text-[15px]">Code Interpreter</span>
            </div>
            <Toggle
              label="Code Interpreter"
              checked={tools.code}
              onChange={(value) => setTools((state) => ({ ...state, code: value }))}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
