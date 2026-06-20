-- Allow the client workspace to update structured customer CRM fields.
-- Required for chat-driven corrections such as date_of_birth updates
-- (api.updateCustomerRecord -> supabase.from("customers").update(...)).
--
-- Without an UPDATE policy, RLS (enabled in schema.sql) denies the write: the
-- update affects 0 rows and PostgREST returns 406, which the workspace reports
-- as "could not save the change to Supabase". Apply this so edits persist:
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run
--   (or: supabase db execute -f this file, or psql "$DB_URL" -f this file)
--
-- SECURITY: `using/with check (true)` with no TO clause grants the write to the
-- `public` role, i.e. ANY holder of the anon key (which ships in the browser
-- bundle) can update ANY customer row. Acceptable for the demo; before real
-- data, scope this to authenticated users and/or specific columns. See the
-- "Demo is read-only public; tighten these before anything real" note in
-- schema.sql.

alter table customers enable row level security;

drop policy if exists "public update" on customers;
create policy "public update" on customers
  for update
  using (true)
  with check (true);
