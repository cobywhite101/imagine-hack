import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/CustomerWorkspace.jsx", import.meta.url), "utf8");

assert.match(
  source,
  /function buildCustomerActivityTimeline\(\{ customer, messages = \[\], memories = \[\], meetings = \[\], articles = \[\] \}\)/,
  "CustomerWorkspace must build an activity timeline for the customer sidebar."
);
assert.match(
  source,
  /const currentTurns = buildCurrentConversationTurns\(messages\);/,
  "CustomerWorkspace activity timeline should read the active conversation first."
);
assert.match(
  source,
  /const conversationTurns = currentTurns\.length \? currentTurns\.slice\(-4\) : buildSavedConversationTurns\(memories\)\.slice\(-4\);/,
  "CustomerWorkspace activity timeline should fall back to saved customer conversation turns."
);
assert.match(
  source,
  /<TabsTrigger[\s\S]*value="activity"[\s\S]*Activity/,
  "CustomerWorkspace should label the middle sidebar tab as Activity."
);
assert.match(
  source,
  /aria-labelledby="customer-activity-heading"/,
  "CustomerWorkspace should expose the sidebar as an activity timeline section."
);
assert.match(
  source,
  /aria-label="Customer activity timeline"/,
  "CustomerWorkspace should render Activity as a timeline list."
);
assert.doesNotMatch(
  source,
  /Conversation summary/,
  "CustomerWorkspace should not render the old conversation summary label."
);
assert.doesNotMatch(
  source,
  /aria-label="Saved customer chatbot history"/,
  "CustomerWorkspace must not render the old saved customer chatbot history list."
);
assert.doesNotMatch(
  source,
  /function openCustomerChatHistory\(memory\)/,
  "CustomerWorkspace must not expose a saved-chat row loader."
);
assert.doesNotMatch(
  source,
  /setMessages\(historyMessages\)/,
  "CustomerWorkspace must not replace the active conversation with a saved chat turn."
);
assert.doesNotMatch(
  source,
  /api\.getAdvisorChatThreads\(\{ limit: 8 \}\)/,
  "CustomerWorkspace should not load global advisor chat threads for customer activity."
);
