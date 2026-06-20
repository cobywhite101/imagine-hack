import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/CustomerWorkspace.jsx", import.meta.url), "utf8");
const start = source.indexOf("const MARKDOWN_DIVIDER_LINE_PATTERN");
const end = source.indexOf("function renderMessageText");

assert.notEqual(start, -1, "CustomerWorkspace must define a markdown divider-line pattern.");
assert.ok(end > start, "CustomerWorkspace must normalize message text before rendering words.");

const getRenderableMessageText = Function(`${source.slice(start, end)}\nreturn getRenderableMessageText;`)();

assert.equal(
  getRenderableMessageText("Intro\n---\nDone", true),
  "Intro\nDone",
  "Assistant markdown divider lines should be hidden."
);
assert.equal(
  getRenderableMessageText("Intro\n- - -\nDone", true),
  "Intro\nDone",
  "Spaced assistant markdown divider lines should be hidden."
);
assert.equal(
  getRenderableMessageText("Intro\n\n---\n\nDone", true),
  "Intro\n\nDone",
  "Removing a divider should not leave a large blank gap."
);
assert.equal(
  getRenderableMessageText("Intro\n---\nDone", false),
  "Intro\n---\nDone",
  "User messages should keep literal divider text."
);
assert.equal(
  getRenderableMessageText("Policy code A---B is valid", true),
  "Policy code A---B is valid",
  "Inline triple dashes should remain visible."
);
