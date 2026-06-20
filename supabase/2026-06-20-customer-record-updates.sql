-- Allow the client workspace to update structured customer CRM fields.
-- Required for chat-driven corrections such as date_of_birth updates.

drop policy if exists "public update" on customers;
create policy "public update" on customers
  for update
  using (true)
  with check (true);
