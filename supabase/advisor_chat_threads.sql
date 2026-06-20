-- Durable advisor chatbot history.
-- Run after supabase/schema.sql.

create table if not exists advisor_chat_threads (
  id text primary key default gen_random_uuid()::text,
  title text not null default 'Untitled chat',
  summary text not null default '',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists advisor_chat_threads_updated_at_idx
  on advisor_chat_threads (updated_at desc);

alter table advisor_chat_threads enable row level security;

drop policy if exists "public read" on advisor_chat_threads;
drop policy if exists "public insert" on advisor_chat_threads;
drop policy if exists "public update" on advisor_chat_threads;
drop policy if exists "public delete" on advisor_chat_threads;

create policy "public read" on advisor_chat_threads for select using (true);
create policy "public insert" on advisor_chat_threads for insert with check (true);
create policy "public update" on advisor_chat_threads for update using (true) with check (true);
create policy "public delete" on advisor_chat_threads for delete using (true);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table advisor_chat_threads;
  end if;
exception
  when duplicate_object then null;
end $$;
