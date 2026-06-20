-- Advisor expense quota, receipt metadata, and proof-of-payment storage.
-- Apply in Supabase SQL Editor before using My Expenses.

create table if not exists advisor_expense_settings (
  id text primary key default 'default',
  total_quota numeric(12, 2) not null default 5000 check (total_quota >= 0),
  updated_at timestamptz not null default now()
);

insert into advisor_expense_settings (id, total_quota)
values ('default', 5000)
on conflict (id) do nothing;

create table if not exists advisor_expenses (
  id text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  label text not null default 'Other',
  merchant text,
  location text,
  expense_date date,
  proof_name text,
  proof_path text,
  ai_confidence numeric(4, 3) check (ai_confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create index if not exists advisor_expenses_created_at_idx
  on advisor_expenses (created_at desc);
create index if not exists advisor_expenses_customer_id_idx
  on advisor_expenses (customer_id);

alter table advisor_expense_settings enable row level security;
alter table advisor_expenses enable row level security;

drop policy if exists "public read" on advisor_expense_settings;
drop policy if exists "public update" on advisor_expense_settings;
drop policy if exists "public read" on advisor_expenses;
drop policy if exists "public insert" on advisor_expenses;
drop policy if exists "public update" on advisor_expenses;
drop policy if exists "public delete" on advisor_expenses;

-- Demo policies. Restrict these to authenticated advisor ownership before production.
create policy "public read" on advisor_expense_settings for select using (true);
create policy "public update" on advisor_expense_settings for update using (true) with check (true);
create policy "public read" on advisor_expenses for select using (true);
create policy "public insert" on advisor_expenses for insert with check (true);
create policy "public update" on advisor_expenses for update using (true) with check (true);
create policy "public delete" on advisor_expenses for delete using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-proofs',
  'expense-proofs',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public expense proof insert" on storage.objects;
drop policy if exists "public expense proof read" on storage.objects;

create policy "public expense proof insert" on storage.objects
  for insert with check (bucket_id = 'expense-proofs');
create policy "public expense proof read" on storage.objects
  for select using (bucket_id = 'expense-proofs');
