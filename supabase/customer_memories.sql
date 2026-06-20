-- Client memory storage for customer chatbot context.
-- Run this after schema.sql so the customers table exists.

create table if not exists customer_memories (
  id text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  kind text not null default 'note',
  title text not null,
  summary text not null,
  body text,
  source_name text,
  source_meta text,
  created_at timestamptz default now()
);

alter table customer_memories add column if not exists body text;

alter table customer_memories enable row level security;
drop policy if exists "public read" on customer_memories;
drop policy if exists "public insert" on customer_memories;
drop policy if exists "public update" on customer_memories;
drop policy if exists "public delete" on customer_memories;
create policy "public read" on customer_memories for select using (true);
create policy "public insert" on customer_memories for insert with check (true);
create policy "public update" on customer_memories for update using (true) with check (true);
create policy "public delete" on customer_memories for delete using (true);

-- Customer memory seed data lives in supabase/aag_memories.sql.
-- Run supabase/aag_seed.sql after schema.sql to ingest durable chatbot memory.
