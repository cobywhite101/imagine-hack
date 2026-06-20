import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/pages/Expenses.jsx", import.meta.url), "utf8");
const client = readFileSync(new URL("../src/services/dataClient.js", import.meta.url), "utf8");
const schema = readFileSync(new URL("../supabase/advisor_expenses.sql", import.meta.url), "utf8");

assert.match(app, /to:\s*"\/expenses",\s*label:\s*"My Expenses"/, "Sidebar must show My Expenses under My Clients.");
assert.match(app, /<Route path="\/expenses" element=\{<Expenses \/>\}/, "App must route /expenses to the expense dashboard.");

for (const label of ["Total Quota", "Total Expenses", "Remaining Quota", "Expense history", "Add New Expense"]) {
  assert.ok(page.includes(label), `Expense dashboard must show ${label}.`);
}
for (const field of ["Title", "Customer", "Proof of Payment"]) {
  assert.ok(page.includes(field), `Add expense modal must include ${field}.`);
}

assert.match(page, /api\.analyzeExpenseProof\(/, "Receipt upload must be evaluated before saving.");
assert.match(page, /api\.saveAdvisorExpense\(/, "Analyzed expenses must be persisted.");
const analyzerStart = client.indexOf("async function analyzeExpenseProof");
const analyzerEnd = client.indexOf("export const api =");
const analyzer = client.slice(analyzerStart, analyzerEnd);
assert.match(client, /import \{ recognize \} from "tesseract\.js";/, "Receipt images must be processed by local OCR.");
assert.match(analyzer, /recognize\(file, "eng"\)/, "Expense proof analysis must extract receipt text before calling DeepSeek.");
assert.match(analyzer, /receiptText\.slice\(0, 12000\)/, "DeepSeek must receive OCR text from the receipt.");
assert.doesNotMatch(analyzer, /image_url/, "The text-only DeepSeek model must never receive an image_url payload.");
assert.match(analyzer, /extractReceiptAmount\(receiptText\)/, "A valid OCR total must remain usable when DeepSeek returns malformed JSON.");

const fallbackStart = client.indexOf("function extractReceiptAmount");
const fallbackEnd = client.indexOf("async function analyzeExpenseProof");
const { extractReceiptAmount, inferExpenseLabel } = Function(
  `${client.slice(fallbackStart, fallbackEnd)}\nreturn { extractReceiptAmount, inferExpenseLabel };`
)();
assert.equal(extractReceiptAmount("SUBTOTAL RM 45.00\nGRAND TOTAL RM 48.60"), 48.6, "OCR fallback must select the final receipt total.");
assert.equal(inferExpenseLabel("Lunch at customer restaurant"), "Client Meal", "OCR fallback must label common client meals.");
assert.match(client, /getAdvisorExpenses:\s*async/, "Data client must load expense history.");
assert.match(client, /saveAdvisorExpense:\s*async/, "Data client must save expense history.");
assert.match(page, /url \|\| initialExpense\?\.proofPreview/, "A reopened receipt must fall back to its durable local preview.");
assert.match(page, /previewUrl === fallback \? "" : fallback/, "A broken signed receipt URL must recover with the local preview.");
assert.match(page, /existingProofPreview:\s*localProofPreview/, "A compressed receipt preview must be saved with the expense.");
assert.match(client, /proofPreview:\s*expense\.proofPreview/, "Expense records must preserve their receipt preview.");
assert.match(client, /cachedExpenses\.filter\(\(expense\) => !remoteIds\.has\(expense\.id\)\)/, "Locally saved receipts must remain visible if remote persistence fails.");
assert.doesNotMatch(client, /if \(error\) proofPath = null/, "A failed storage upload must not erase an existing receipt path.");

assert.match(schema, /create table if not exists advisor_expenses/i, "Supabase schema must create the expense table.");
assert.match(schema, /create table if not exists advisor_expense_settings/i, "Supabase schema must create quota settings.");
assert.match(schema, /'expense-proofs'/, "Supabase schema must create proof-of-payment storage.");
assert.doesNotMatch(schema, /insert into advisor_expenses\s*\(/i, "Expense history must be empty by default.");
