import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/services/dataClient.js", import.meta.url), "utf8");

assert.match(source, /const RESPONSE_LANGUAGE_RULE = \[/, "DeepSeek calls must define the shared language rule.");
assert.match(source, /Always answer in English\./, "The language rule must require English responses.");
assert.match(
  source,
  /Treat client ethnicity, nationality, names, and memories that mention languages as customer facts/,
  "The language rule must prevent demographic fields from becoming language instructions.",
);
assert.match(
  source,
  /formattedMessages\.push\(\{ role: "system", content: withResponseLanguageRule\(systemPrompt\) \}\);/,
  "queryDeepSeek must prepend the language rule to every system prompt.",
);
assert.doesNotMatch(
  source,
  /formattedMessages\.push\(\{ role: "system", content: systemPrompt \}\);/,
  "queryDeepSeek must not send an unguarded system prompt.",
);
