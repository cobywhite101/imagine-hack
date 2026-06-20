-- Advisor Home data: task board, stats, and meetings calendar.
-- Run after schema.sql and aag_seed.sql so the customer references exist.

create table if not exists advisor_tasks (
  id text primary key default gen_random_uuid()::text,
  customer_id text references customers(id) on delete set null,
  title text not null,
  icon text,
  priority text,
  category text,
  status text not null default 'To Do',
  notes text,
  due_date date,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists advisor_tasks_customer_id_idx
  on advisor_tasks (customer_id);
create index if not exists advisor_tasks_status_due_date_idx
  on advisor_tasks (status, due_date);

create table if not exists advisor_meetings (
  id text primary key default gen_random_uuid()::text,
  customer_id text references customers(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  notes text,
  status text not null default 'scheduled',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists advisor_meetings_customer_id_idx
  on advisor_meetings (customer_id);
create index if not exists advisor_meetings_starts_at_idx
  on advisor_meetings (starts_at);

alter table advisor_tasks enable row level security;
alter table advisor_meetings enable row level security;

drop policy if exists "public read" on advisor_tasks;
drop policy if exists "public insert" on advisor_tasks;
drop policy if exists "public update" on advisor_tasks;
drop policy if exists "public delete" on advisor_tasks;
drop policy if exists "public read" on advisor_meetings;
drop policy if exists "public insert" on advisor_meetings;
drop policy if exists "public update" on advisor_meetings;
drop policy if exists "public delete" on advisor_meetings;

create policy "public read" on advisor_tasks for select using (true);
create policy "public insert" on advisor_tasks for insert with check (true);
create policy "public update" on advisor_tasks for update using (true) with check (true);
create policy "public delete" on advisor_tasks for delete using (true);

create policy "public read" on advisor_meetings for select using (true);
create policy "public insert" on advisor_meetings for insert with check (true);
create policy "public update" on advisor_meetings for update using (true) with check (true);
create policy "public delete" on advisor_meetings for delete using (true);

with seed_tasks (
  id,
  customer_id,
  title,
  icon,
  priority,
  category,
  status,
  notes,
  due_offset_days,
  sort_order
) as (
  values
    (
      'task-goh-mei-ling-planning',
      'CL-0048',
      'Prepare Goh Mei Ling will-planning brief',
      'notepad',
      'High',
      'Client prep',
      'To Do',
      'Use the saved profile and policy notes before the 9:30 review.',
      0,
      10
    ),
    (
      'task-anand-kyc-reminder',
      'CL-0005',
      'Send Anand KYC reminder',
      'mail',
      'High',
      'Follow-up',
      'Follow-up',
      'KYC documents are pending; send a concise email reminder.',
      0,
      20
    ),
    (
      'task-farid-life-renewal',
      'CL-0050',
      'Confirm Farid life renewal next step',
      'mail',
      'High',
      'Follow-up',
      'Follow-up',
      'Life renewal lands today. Confirm whether will planning should be paired with the renewal review.',
      0,
      30
    ),
    (
      'task-lim-hui-min-renewal',
      'CL-0099',
      'Draft Lim Hui Min renewal talking points',
      'notepad',
      'Medium',
      'Renewal',
      'In progress',
      'Life renewal is due soon. Prepare a short agenda and risk update.',
      6,
      40
    ),
    (
      'task-profile-article-cleanup',
      null,
      'Close completed customer profile cleanup',
      'check',
      'Low',
      'Ops',
      'Done',
      'Profile articles were generated and indexed for the first live clients.',
      0,
      50
    )
)
insert into advisor_tasks (
  id,
  customer_id,
  title,
  icon,
  priority,
  category,
  status,
  notes,
  due_date,
  sort_order,
  updated_at
)
select
  id,
  customer_id,
  title,
  icon,
  priority,
  category,
  status,
  notes,
  current_date + due_offset_days,
  sort_order,
  now()
from seed_tasks
where customer_id is null or exists (
  select 1 from customers where customers.id = seed_tasks.customer_id
)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  title = excluded.title,
  icon = excluded.icon,
  priority = excluded.priority,
  category = excluded.category,
  status = excluded.status,
  notes = excluded.notes,
  due_date = excluded.due_date,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at;

with seed_meetings (
  id,
  customer_id,
  title,
  start_time,
  end_time,
  notes
) as (
  values
    (
      'meeting-goh-mei-ling-review',
      'CL-0048',
      'Goh Mei Ling portfolio review',
      time '09:30',
      time '10:15',
      'Review life coverage, estate planning status, and current next action.'
    ),
    (
      'meeting-farid-renewal',
      'CL-0050',
      'Farid bin Ismail life renewal',
      time '11:30',
      time '12:00',
      'Life policy renewal is due today.'
    ),
    (
      'meeting-aisyah-review',
      'CL-0038',
      'Aisyah binti Yusof policy review',
      time '14:00',
      time '14:45',
      'Discuss will planning and upcoming life renewal.'
    )
)
insert into advisor_meetings (
  id,
  customer_id,
  title,
  starts_at,
  ends_at,
  all_day,
  notes,
  status,
  updated_at
)
select
  id,
  customer_id,
  title,
  (current_date + start_time) at time zone 'Asia/Kuala_Lumpur',
  (current_date + end_time) at time zone 'Asia/Kuala_Lumpur',
  false,
  notes,
  'scheduled',
  now()
from seed_meetings
where exists (
  select 1 from customers where customers.id = seed_meetings.customer_id
)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  all_day = excluded.all_day,
  notes = excluded.notes,
  status = excluded.status,
  updated_at = excluded.updated_at;
