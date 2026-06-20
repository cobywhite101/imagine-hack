-- Add the `ethnicity` fact-find field to customers and backfill existing rows.
--
-- The client workspace profile card and the chat-driven record editor both read
-- `customers.ethnicity` (see normalizeCustomerRecord + CUSTOMER_RECORD_FIELD_DEFINITIONS).
-- Ethnicity is a standard Malaysian fact-find field; the seeded AAG clients encode
-- it in their patrilineal naming markers, so we derive a sensible default here:
--   Malay  -> name contains bin / binti / bt
--   Indian -> name contains a/l, a/p, s/o, d/o
--   else   -> Chinese
-- Advisors can still correct any value from the workspace chat afterwards.
--
-- Apply: Supabase Dashboard -> SQL Editor -> paste -> Run
--   (or: supabase db execute -f this file, or psql "$DB_URL" -f this file)

alter table customers add column if not exists ethnicity text;

update customers
set ethnicity = case
  when lower(name) ~ '\m(bin|binti|bt)\M' then 'Malay'
  when lower(name) ~ '(a/l|a/p|s/o|d/o)' then 'Indian'
  else 'Chinese'
end
where ethnicity is null;
