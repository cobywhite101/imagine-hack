import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/services/dataClient.js", import.meta.url), "utf8");

assert.match(
  source,
  /function getPotentialCatchUpSeedMeeting\(customers = \[\]\)/,
  "Home meeting data should derive the Mahesh catch-up seed from the customer list."
);
assert.match(
  source,
  /title:\s*`Potential Catch up with \$\{shortName\}`/,
  "The seeded Mahesh meeting should use the requested title format."
);
assert.match(
  source,
  /notes:\s*"Client input"/,
  "The seeded Mahesh meeting should preserve the client input note."
);
assert.match(
  source,
  /start:\s*`\$\{today\}T16:00`/,
  "The seeded Mahesh meeting should land on today."
);
assert.match(
  source,
  /return mergeSeededHomeMeetings\(buildCustomerHomeMeetings\(customers\), customers\);/,
  "Fallback advisor meetings should include the seeded Mahesh catch-up."
);
