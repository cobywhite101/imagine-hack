import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/CustomerWorkspace.jsx", import.meta.url), "utf8");
const normalizerStart = source.indexOf("function normalizeConversationMessageText");
const normalizerEnd = source.indexOf("function parseCustomerConversationMemory");

assert.notEqual(normalizerStart, -1, "CustomerWorkspace must preserve full conversation message formatting.");
assert.ok(normalizerEnd > normalizerStart, "Conversation formatting normalizer must be independently testable.");

const normalizeConversationMessageText = Function(
  `${source.slice(normalizerStart, normalizerEnd)}\nreturn normalizeConversationMessageText;`
)();

const formattedReply = "Intro\r\n\r\n## Situation\r\n- First point\r\n- Second point\r\n\r\n---\r\n\r\n**Next step**";
assert.equal(
  normalizeConversationMessageText(formattedReply),
  "Intro\n\n## Situation\n- First point\n- Second point\n\n---\n\n**Next step**",
  "Conversation history must preserve Markdown headings, lists, emphasis, dividers, and paragraph breaks."
);

assert.match(
  source,
  /text:\s*normalizeConversationMessageText\(assistantText\)/,
  "Saved assistant turns must retain their original Markdown structure."
);
assert.match(
  source,
  /text:\s*normalizeConversationMessageText\(message\.text\)/,
  "Current assistant turns must retain their original Markdown structure."
);

const modalStart = source.indexOf("function ConversationHistoryModal");
const modalEnd = source.indexOf("function CustomerActivityTimeline");
const modalSource = source.slice(modalStart, modalEnd);

assert.match(
  modalSource,
  /<CustomerChatMessage message=\{historyMessage\} \/>/,
  "Conversation history must use the same message component as the live customer chatbot."
);
assert.doesNotMatch(
  modalSource,
  /bg-\[#eef0ff\]/,
  "Conversation history must not wrap assistant responses in the old single-block bubble."
);
