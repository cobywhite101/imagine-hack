import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/* Knowledge "source file" UI — a faithful port of Intercom's Knowledge Hub:
   - SourceFileRow: the "Articles · Snippets, public, internal, docs" list row.
   - ArticleEditor: the full "Internal article" editor that opens on click.
   Styled to match the light, hardcoded look of the customer workspace panel
   (not the dark DESIGN.md theme). Colors/icons mirror the captured component.
   Reference colors: ink #1a1a1a, muted #646462, surface #f8f8f7, line #e9eae6,
   disabled #81817e, toolbar #222222, hover accent #266df0. */

/* The stacked-lines "campaign" glyph Intercom uses for an article folder. */
export function ArticleStackIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3.01006 12.5L1.57006 15H14.4301L12.9901 12.5H3.01006ZM3.01006 8.5L1.57006 11H14.4301L12.9901 8.5H3.01006ZM11.5401 2H4.45006L1.56006 7H14.4201L11.5301 2H11.5401Z" />
    </svg>
  );
}

/* One row in the Knowledge "source files" list. */
export function SourceFileRow({ title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center py-3 text-left"
    >
      <span className="mr-2 flex size-4 shrink-0 items-center justify-center text-[#1a1a1a]">
        <ArticleStackIcon className="size-4" />
      </span>
      <span className="min-w-0 truncate text-[14px] leading-5 text-[#1a1a1a] group-hover:text-[#266df0] group-hover:underline">
        {title}
        {subtitle && <span className="text-[#646462]"> · {subtitle}</span>}
      </span>
    </button>
  );
}

/* Toolbar glyphs — exact paths from the captured composer media toolbar. */
const TOOL_ICONS = [
  {
    name: "Image",
    node: (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.5 4.5V10.4852C3.55631 9.53325 5.48097 8.49038 7.5 9.49989C9.60807 10.5539 12.1276 9.88495 13.5 9.25485V4.5H2.5ZM2 3C1.44772 3 1 3.44771 1 4V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V4C15 3.44772 14.5523 3 14 3H2ZM11.25 8.5C11.9404 8.5 12.5 7.94036 12.5 7.25C12.5 6.55964 11.9404 6 11.25 6C10.5596 6 10 6.55964 10 7.25C10 7.94036 10.5596 8.5 11.25 8.5Z"
      />
    ),
  },
  {
    name: "Video",
    node: (
      <path d="M14 3H2C1.45 3 1 3.45 1 4V13C1 13.55 1.45 14 2 14H14C14.55 14 15 13.55 15 13V4C15 3.45 14.55 3 14 3ZM10.75 8.75999L6.45 11.24C6.25 11.36 6 11.21 6 10.98V6.02C6 5.79 6.25 5.63999 6.45 5.75999L10.75 8.24001C10.95 8.36001 10.95 8.63999 10.75 8.75999Z" />
    ),
  },
  {
    name: "Table",
    node: (
      <path d="M14 2H2C1.45 2 1 2.45 1 3V13C1 13.55 1.45 14 2 14H14C14.55 14 15 13.55 15 13V3C15 2.45 14.55 2 14 2ZM2.5 6H5.13V8.5H2.5V6ZM6.63 6H9.36V8.5H6.63V6ZM10.87 6H13.5V8.5H10.87V6ZM2.5 12.5V10H5.13V12.5H2.5ZM6.63 12.5V10H9.36V12.5H6.63ZM10.87 12.5V10H13.5V12.5H10.87Z" />
    ),
  },
  {
    name: "Divider",
    node: (
      <path d="M12 2H4V3.70001H12V2ZM4 14H12V12.3H4V14ZM1 8C1 9.1 1.9 10 3 10H13C14.1 10 15 9.1 15 8C15 6.9 14.1 6 13 6H3C1.9 6 1 6.9 1 8Z" />
    ),
  },
  {
    name: "Button",
    node: (
      <path d="M12 2H4C2.34 2 1 3.34 1 5C1 6.66 2.34 8 4 8H6.5V7.92001C6.5 6.82001 7.4 5.92001 8.5 5.92001C9 5.92001 9.48 6.11001 9.85 6.45001L11.54 8H12C13.66 8 15 6.66 15 5C15 3.34 13.66 2 12 2ZM8.84 7.54999C8.74 7.45999 8.62 7.42001 8.5 7.42001C8.24 7.42001 8 7.62001 8 7.92001V13.67C8 13.96 8.24 14.17 8.5 14.17C8.57 14.17 8.64 14.16 8.7 14.13L10.13 13.5L11.04 15.56C11.16 15.84 11.44 16.01 11.73 16.01C11.83 16.01 11.94 15.99 12.03 15.95C12.41 15.78 12.58 15.34 12.41 14.96L11.5 12.9L12.92 12.27C13.25 12.12 13.32 11.69 13.06 11.44L8.84 7.56V7.54999Z" />
    ),
  },
  {
    name: "Messenger card",
    node: (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 2.4c0-.22.18-.4.4-.4h11.2c.22 0 .4.18.4.4v.7a.4.4 0 0 1-.4.4H2.4a.4.4 0 0 1-.4-.4v-.7zm0 10.5c0-.22.18-.4.4-.4h11.2c.22 0 .4.18.4.4v.7a.4.4 0 0 1-.4.4H2.4a.4.4 0 0 1-.4-.4v-.7zM1 7.2A2.2 2.2 0 0 1 3.2 5h9.6A2.2 2.2 0 0 1 15 7.2v1.6a2.2 2.2 0 0 1-2.2 2.2H3.2A2.2 2.2 0 0 1 1 8.8V7.2zm1.5.3a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-1z"
      />
    ),
  },
  {
    name: "Code block",
    node: (
      <path d="M14 3H12V4.5H13.5V12.5H2.5V8H1V13C1 13.55 1.45 14 2 14H14C14.55 14 15 13.55 15 13V4C15 3.45 14.55 3 14 3ZM6.7 7.1C6.87 7.27 7.08 7.35 7.3 7.35C7.52 7.35 7.73999 7.27 7.89999 7.1L11 4L7.89999 0.9C7.56999 0.57 7.03 0.57 6.7 0.9C6.37 1.23 6.37 1.77 6.7 2.1L8.60001 4L6.7 5.9C6.37 6.23 6.37 6.77 6.7 7.1ZM3.7 7.35C3.92 7.35 4.14 7.27 4.3 7.1C4.63 6.77 4.63 6.23 4.3 5.9L2.39999 4L4.3 2.1C4.63 1.77 4.63 1.23 4.3 0.9C3.97 0.57 3.43001 0.57 3.10001 0.9L0 4L3.10001 7.1C3.27001 7.27 3.48 7.35 3.7 7.35Z" />
    ),
  },
  {
    name: "Bulleted list",
    node: (
      <path d="M7 12H15V10.3H7V12ZM7 4V5.7H15V4H7ZM3 9.5C2.17 9.5 1.5 10.17 1.5 11C1.5 11.83 2.17 12.5 3 12.5C3.83 12.5 4.5 11.83 4.5 11C4.5 10.17 3.83 9.5 3 9.5ZM3 3.5C2.17 3.5 1.5 4.17 1.5 5C1.5 5.83 2.17 6.5 3 6.5C3.83 6.5 4.5 5.83 4.5 5C4.5 4.17 3.83 3.5 3 3.5Z" />
    ),
  },
  {
    name: "Numbered list",
    node: (
      <path d="M7.00006 12H15.0001V10.3H7.00006V12ZM7.00006 4V5.7H15.0001V4H7.00006ZM2.51007 7.03H4.04007V1.78H2.67007L1.40005 2.56L1.36005 2.58V3.93L2.50006 3.25V7.03H2.51007ZM3.91006 12.51C4.30006 12.19 4.60006 11.9 4.81006 11.67C5.03006 11.43 5.18007 11.21 5.26007 11.01C5.34007 10.81 5.39008 10.6 5.39008 10.4C5.39008 10.07 5.30007 9.78 5.13007 9.53C4.96007 9.29 4.72006 9.09 4.41006 8.96C4.10006 8.83 3.74007 8.76 3.32007 8.76C2.90007 8.76 2.56007 8.83 2.26007 8.98C1.96007 9.12 1.72005 9.33 1.55005 9.6C1.38005 9.87 1.30005 10.19 1.30005 10.56V10.64H2.76007V10.56C2.76007 10.43 2.78005 10.32 2.83005 10.23C2.88005 10.14 2.94005 10.08 3.02005 10.03C3.10005 9.98 3.20007 9.96 3.32007 9.96C3.44007 9.96 3.54006 9.98 3.62006 10.03C3.71006 10.07 3.77007 10.14 3.82007 10.22C3.87007 10.3 3.89008 10.4 3.89008 10.52C3.89008 10.63 3.87007 10.72 3.82007 10.81C3.77007 10.9 3.71006 10.99 3.62006 11.08C3.53006 11.17 3.43005 11.27 3.30005 11.37L1.37006 12.96V14.06H5.43005V12.81H3.54007L3.90005 12.52L3.91006 12.51Z" />
    ),
  },
  {
    name: "Collapsible section",
    node: (
      <>
        <path d="M11.8499 4.85L14.8499 1.85C15.1599 1.54 14.9399 1 14.4999 1H8.49995C8.04995 1 7.82995 1.54 8.14995 1.85L11.1499 4.85C11.3499 5.05 11.6599 5.05 11.8599 4.85H11.8499Z" />
        <path d="M13.27 6V13.27H2.75005V2.7H6V1H2.40005C1.66005 1 1.05005 1.61 1.05005 2.35V13.62C1.05005 14.36 1.66005 14.97 2.40005 14.97H13.62C14.36 14.97 14.97 14.36 14.97 13.62V6H13.27Z" />
      </>
    ),
  },
  {
    name: "Attachment",
    node: (
      <path d="M5.02005 14.24C3.86005 14.24 2.77004 13.79 1.94004 12.97C1.11004 12.15 0.670044 11.06 0.670044 9.89C0.670044 8.72 1.12004 7.64 1.94004 6.81L6.74005 2.01C7.07005 1.68 7.61004 1.68 7.94004 2.01C8.27004 2.34 8.27004 2.88 7.94004 3.21L3.14005 8.01C2.64005 8.51 2.36005 9.18 2.36005 9.88C2.36005 10.58 2.64005 11.25 3.14005 11.75C4.14005 12.75 5.89005 12.75 6.89005 11.75L13.37 5.27C13.72 4.92 13.72 4.35 13.37 4C13.03 3.66 12.44 3.66 12.1 4L5.76004 10.34C5.43004 10.67 4.89005 10.67 4.56005 10.34C4.23005 10.01 4.23005 9.47 4.56005 9.14L10.9 2.8C11.91 1.79 13.56 1.78 14.58 2.8C15.07 3.29 15.34 3.94 15.34 4.64C15.34 5.34 15.07 5.99 14.58 6.48L8.10004 12.96C7.28004 13.78 6.19005 14.23 5.02005 14.23V14.24Z" />
    ),
  },
];

function TitleArea({ value, onChange }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      autoFocus
      dir="ltr"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Untitled internal article"
      aria-label="Article title"
      className="mb-2 block w-full resize-none overflow-hidden border-none bg-transparent p-0 text-[32px] font-bold leading-[1.3] text-[#1a1a1a] outline-none placeholder:text-[#aaaaa8]"
    />
  );
}

export function ArticleEditor({ article, onClose, onSave }) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef(null);
  const initialBody = useRef(article?.body ?? "");
  const [bodyEmpty, setBodyEmpty] = useState(!String(article?.body ?? "").trim());

  const canSave = title.trim().length > 0;
  const kindLabel = article?.type || "Internal article";

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
      ...article,
      title: title.trim(),
      type: kindLabel,
      body: bodyRef.current?.innerHTML ?? initialBody.current,
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/30 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={cn(
          "relative my-6 flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(20,20,20,0.24)] transition-[max-width] duration-200",
          expanded ? "max-w-[980px]" : "max-w-[720px]"
        )}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between rounded-t-2xl border-b border-[#e9eae6] bg-white px-6 py-4">
          <h1 className="truncate pr-2 text-[20px] font-semibold leading-8 text-[#1a1a1a]">
            {kindLabel}
          </h1>
          <div className="flex items-center gap-x-2">
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
              className={cn(
                "h-8 rounded-full px-3 text-[14px] font-semibold leading-4 transition-colors",
                canSave
                  ? "bg-[#1a1a1a] text-white hover:bg-black"
                  : "cursor-not-allowed bg-[#f8f8f7] text-[#81817e]"
              )}
            >
              Save
            </button>

            <div className="mx-2 h-5 w-px bg-[#e9eae6]" />

            <button
              type="button"
              aria-label={expanded ? "Collapse" : "Expand"}
              onClick={() => setExpanded((value) => !value)}
              className="flex size-8 items-center justify-center rounded-full bg-[#f8f8f7] text-[#1a1a1a] transition-colors hover:bg-[#eeeeec]"
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M6.48999 8.31L3.68999 11.11V9.41C3.68999 8.94 3.30999 8.56 2.83999 8.56C2.36999 8.56 1.98999 8.94 1.98999 9.41V14.01H6.58999C7.05999 14.01 7.43999 13.63 7.43999 13.16C7.43999 12.69 7.05999 12.31 6.58999 12.31H4.88999L7.68999 9.51L6.48999 8.31ZM9.40999 1.99C8.93999 1.99 8.55999 2.37 8.55999 2.84C8.55999 3.31 8.93999 3.69 9.40999 3.69H11.11L8.30999 6.49L9.50999 7.69L12.31 4.89V6.59C12.31 7.06 12.69 7.44 13.16 7.44C13.63 7.44 14.01 7.06 14.01 6.59V1.99H9.40999Z" />
              </svg>
            </button>
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

        {/* Scrollable editor body */}
        <div className="relative flex-1 overflow-auto">
          <div className="mx-auto flex w-full max-w-[640px] flex-col px-10 pb-32 pt-10">
            <TitleArea value={title} onChange={setTitle} />

            <div className="relative mt-2 text-[16px] leading-[1.53] text-[#1a1a1a]">
              {bodyEmpty && (
                <p className="pointer-events-none absolute left-0 top-0 text-[#646462]">
                  Start writing…
                </p>
              )}
              <div
                ref={bodyRef}
                role="textbox"
                contentEditable
                suppressContentEditableWarning
                dir="ltr"
                onInput={(event) => setBodyEmpty(!event.currentTarget.textContent.trim())}
                className="min-h-[120px] whitespace-pre-wrap outline-none"
                dangerouslySetInnerHTML={{ __html: initialBody.current }}
              />
            </div>
          </div>

          {/* Floating media toolbar */}
          <div className="pointer-events-none sticky bottom-6 flex justify-center px-10">
            <div className="pointer-events-auto flex items-center gap-1 rounded-md bg-[#222222] px-2 py-1 shadow-[0_8px_16px_rgba(20,20,20,0.15)]">
              {TOOL_ICONS.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  aria-label={icon.name}
                  className="flex size-7 items-center justify-center rounded text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
                    {icon.node}
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
