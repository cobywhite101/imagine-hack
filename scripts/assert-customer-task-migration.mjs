import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(root, "supabase/2026-06-21-customer-task-variety.sql");
const generatorPath = path.join(root, "scripts/sync-aag-data.mjs");
const migration = fs.readFileSync(migrationPath, "utf8");
const generator = fs.readFileSync(generatorPath, "utf8");
const generatedTaskBlock = generator.slice(
  generator.indexOf("const customerTasksSql ="),
  generator.indexOf("const memoriesSql =")
);

if (/\bnext_action\b/.test(migration) || /\bnext_action\b/.test(generatedTaskBlock)) {
  throw new Error("Customer task refresh must not require the optional next_action column.");
}

if (!/set\s+task\s*=\s*task_seed\.task\s+from/si.test(migration)) {
  throw new Error("Customer task refresh does not update customers.task from the generated values.");
}

const taskValues = [...migration.matchAll(/^\s*\('CL-\d{4}', '((?:''|[^'])*)'\),?$/gm)].map((match) =>
  match[1].replaceAll("''", "'")
);

if (taskValues.length !== 100) {
  throw new Error(`Expected 100 customer task updates, found ${taskValues.length}.`);
}

if (new Set(taskValues).size !== taskValues.length) {
  throw new Error("Every customer task must be unique.");
}

const longestTask = Math.max(...taskValues.map((task) => task.length));
if (longestTask > 40) {
  throw new Error(`Customer tasks must stay concise; longest value is ${longestTask} characters.`);
}
