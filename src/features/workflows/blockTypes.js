// Registry of workflow block types. Each entry defines how a block looks (icon,
// color chip, group) and what it can be configured with (`fields`). The config
// panel renders `fields` generically, so adding a new block type here is enough
// to make it fully buildable on the canvas — no panel changes needed.

import {
  FileEdit,
  Clock,
  Filter,
  GitBranch,
  Globe,
  Sparkles,
  SquareCheckBig,
  Mail,
} from "lucide-react";

export const BLOCK_TYPES = {
  "record-updated": {
    label: "Record updated",
    group: "Trigger",
    kind: "trigger",
    icon: FileEdit,
    chip: "bg-blue-50 text-blue-600 border-blue-100",
    blurb: "When a record's attribute changes",
    fields: [
      { key: "object", label: "Object", type: "select", options: ["Deals", "Companies", "People"] },
      {
        key: "attribute",
        label: "Attribute",
        type: "select",
        optional: true,
        placeholder: "Any attribute",
        options: ["Deal stage", "Owner", "Amount", "Status", "Close date"],
        help: "Only trigger when this attribute is updated. Leave blank to trigger on any change.",
      },
    ],
  },
  schedule: {
    label: "Scheduled",
    group: "Trigger",
    kind: "trigger",
    icon: Clock,
    chip: "bg-sky-50 text-sky-600 border-sky-100",
    blurb: "Runs on a recurring schedule",
    fields: [
      { key: "frequency", label: "Frequency", type: "select", options: ["Every day", "Every weekday", "Every week"] },
      { key: "time", label: "Time", type: "select", options: ["9:00 AM", "12:00 PM", "6:00 PM"] },
    ],
  },
  filter: {
    label: "Filter",
    group: "Logic",
    kind: "logic",
    icon: Filter,
    chip: "bg-amber-50 text-amber-600 border-amber-100",
    blurb: "Only continue when conditions are met",
    fields: [
      { key: "attribute", label: "Attribute", type: "select", options: ["Deal stage", "Amount", "Owner", "Tier", "Status"] },
      { key: "operator", label: "Condition", type: "select", options: ["is", "is not", "contains", "is greater than"] },
      { key: "value", label: "Value", type: "text", placeholder: "e.g. In Progress" },
    ],
  },
  branch: {
    label: "Branch",
    group: "Logic",
    kind: "logic",
    icon: GitBranch,
    chip: "bg-indigo-50 text-indigo-600 border-indigo-100",
    blurb: "Split into paths by a condition",
    fields: [
      { key: "attribute", label: "Attribute", type: "select", options: ["Deal stage", "Amount", "Tier", "Owner"] },
      { key: "operator", label: "Condition", type: "select", options: ["is", "is not", "is greater than"] },
      { key: "value", label: "Value", type: "text", placeholder: "e.g. Enterprise" },
    ],
  },
  "web-agent": {
    label: "Web agent",
    group: "AI agent",
    kind: "agent",
    icon: Globe,
    chip: "bg-violet-50 text-violet-600 border-violet-100",
    blurb: "Researches the web and returns findings",
    fields: [
      { key: "prompt", label: "Research prompt", type: "textarea", placeholder: "What should the agent research?" },
      { key: "model", label: "Model", type: "select", options: ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"] },
    ],
  },
  "custom-agent": {
    label: "Custom agent",
    group: "AI agent",
    kind: "agent",
    icon: Sparkles,
    chip: "bg-pink-50 text-pink-600 border-pink-100",
    blurb: "Runs custom instructions over prior context",
    fields: [
      { key: "instructions", label: "Instructions", type: "textarea", placeholder: "Describe what this agent should do..." },
      { key: "model", label: "Model", type: "select", options: ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"] },
      { key: "output", label: "Output", type: "select", options: ["Text", "Email draft", "JSON"] },
    ],
  },
  "create-task": {
    label: "Create task",
    group: "Action",
    kind: "action",
    icon: SquareCheckBig,
    chip: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blurb: "Creates a task on a record",
    fields: [
      { key: "title", label: "Task title", type: "text", placeholder: "e.g. Review intro email" },
      { key: "assignee", label: "Assignee", type: "select", options: ["Deal owner", "Me", "Round robin"] },
      { key: "due", label: "Due", type: "select", options: ["Today", "1 day", "3 days", "1 week"] },
    ],
  },
  "send-email": {
    label: "Send email",
    group: "Action",
    kind: "action",
    icon: Mail,
    chip: "bg-teal-50 text-teal-600 border-teal-100",
    blurb: "Sends an email from a template",
    fields: [
      { key: "to", label: "To", type: "select", options: ["Primary contact", "Deal owner", "Champion"] },
      { key: "subject", label: "Subject", type: "text", placeholder: "Email subject" },
      { key: "body", label: "Body", type: "textarea", placeholder: "Write the email..." },
    ],
  },
};

// Fallback used if a block references an unknown type.
const FALLBACK = {
  label: "Unknown block",
  group: "Step",
  kind: "action",
  icon: SquareCheckBig,
  chip: "bg-secondary text-muted-foreground border-border",
  blurb: "Unrecognized block type",
  fields: [],
};

export const getBlockType = (type) => BLOCK_TYPES[type] ?? FALLBACK;

// Block types offered when an advisor adds a step (triggers are excluded —
// a workflow has exactly one, as its first block).
export const STEP_GROUPS = [
  { label: "Logic", types: ["filter", "branch"] },
  { label: "AI agent", types: ["web-agent", "custom-agent"] },
  { label: "Action", types: ["create-task", "send-email"] },
];

let seq = 0;
export const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

// Build the default config for a type from its field definitions.
export function defaultConfig(type) {
  return getBlockType(type).fields.reduce((acc, f) => {
    acc[f.key] = f.options ? (f.optional ? "" : f.options[0]) : "";
    return acc;
  }, {});
}

// Create a fresh block instance ready to drop on the canvas.
export function createBlock(type) {
  return { id: `blk-${uid()}`, type, description: "", config: defaultConfig(type) };
}
