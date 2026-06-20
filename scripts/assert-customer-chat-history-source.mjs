import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/CustomerWorkspace.jsx", import.meta.url), "utf8");

assert.match(
  source,
  /function buildCustomerConversationSummary\(\{ customer, messages = \[\], memories = \[\] \}\)/,
  "CustomerWorkspace must build a conversation summary for the customer sidebar."
);
assert.match(
  source,
  /const currentTurns = buildCurrentConversationTurns\(messages\);/,
  "CustomerWorkspace conversation summary should read the active conversation first."
);
assert.match(
  source,
  /const savedTurns = buildSavedConversationTurns\(memories\);/,
  "CustomerWorkspace conversation summary should fall back to saved customer conversation turns."
);
assert.match(
  source,
  /const turns = currentTurns\.length \? currentTurns : savedTurns;/,
  "CustomerWorkspace conversation summary must prefer the current conversation over saved turns."
);
assert.match(
  source,
  /aria-labelledby="conversation-summary-heading"/,
  "CustomerWorkspace should expose the sidebar as a conversation summary section."
);
assert.match(
  source,
  /<h3 id="conversation-summary-heading"[\s\S]*Conversation summary/,
  "CustomerWorkspace should label the sidebar section as a conversation summary."
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
  "CustomerWorkspace should not load global advisor chat threads for the customer summary."
);
