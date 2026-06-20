-- Per-customer internal articles generated from meeting minutes or edited by
-- advisors in the workflow Details panel. Run after schema.sql and
-- customer_memories.sql.

create table if not exists customer_articles (
  id text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  title text not null default 'Untitled internal article',
  subtitle text,
  article_type text not null default 'Internal article',
  body text not null default '',
  source_memory_id text references customer_memories(id) on delete set null,
  source_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists customer_articles_customer_id_updated_at_idx
  on customer_articles (customer_id, updated_at desc);

alter table customer_articles enable row level security;

drop policy if exists "public read" on customer_articles;
drop policy if exists "public insert" on customer_articles;
drop policy if exists "public update" on customer_articles;
drop policy if exists "public delete" on customer_articles;

create policy "public read" on customer_articles for select using (true);
create policy "public insert" on customer_articles for insert with check (true);
create policy "public update" on customer_articles for update using (true) with check (true);
create policy "public delete" on customer_articles for delete using (true);
