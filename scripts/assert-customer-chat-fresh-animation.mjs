import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/CustomerWorkspace.jsx", import.meta.url), "utf8");
const start = source.indexOf("function shouldAnimateMessageText");
const end = source.indexOf("function renderMessageText");

assert.notEqual(start, -1, "CustomerWorkspace must separate assistant text animation from assistant role.");
assert.ok(end > start, "shouldAnimateMessageText must be defined before renderMessageText.");

const shouldAnimateMessageText = Function(`${source.slice(start, end)}\nreturn shouldAnimateMessageText;`)();

assert.equal(
  shouldAnimateMessageText({ id: "fresh", role: "assistant", animateText: true }),
  true,
  "Fresh assistant replies should animate."
);
assert.equal(
  shouldAnimateMessageText({ id: "history", role: "assistant", text: "Saved generated reply" }),
  false,
  "Saved assistant history should not replay the Grok fade-in."
);
assert.equal(
  shouldAnimateMessageText({ id: "user", role: "user", animateText: true }),
  false,
  "User messages should never use the assistant fade-in."
);

assert.match(
  source,
  /renderMessageText\(message\.text,\s*true,\s*animateText\)/,
  "Assistant message rendering must pass the freshness flag into renderMessageText."
);
assert.match(
  source,
  /renderMessageText\(finalPreText,\s*true,\s*animateText\)/,
  "Email draft pre-text must use the same freshness flag as normal assistant text."
);
assert.match(
  source,
  /setMessages\(\(prev\) => \[\.\.\.prev,\s*\{\s*\.\.\.reply,\s*animateText:\s*true\s*\}\]\)/,
  "Fresh API replies must be tagged for one-time generated text animation."
);
assert.doesNotMatch(
  source,
  /setMessages\(historyMessages\)/,
  "Saved conversation summaries must not reload prior generated text into the main pane."
);
