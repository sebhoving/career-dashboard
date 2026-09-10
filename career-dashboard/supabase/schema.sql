-- Career transition dashboard schema.
--
-- Run this first, in the Supabase SQL editor. Then sign in once (if you have
-- not already) and run seed.sql to load the reference data.
--
-- Safe to run more than once: anything that already exists is skipped, and
-- policies and the trigger are dropped and recreated. It does not alter
-- columns of a table that already exists, except the two modules changes
-- explained at that table.

-- ---------------------------------------------------------------- enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role' and typnamespace = 'public'::regnamespace) then
    create type app_role as enum ('ADMIN', 'VIEWER');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_category' and typnamespace = 'public'::regnamespace) then
    create type task_category as enum ('DSA', 'PYTORCH', 'PHYSICS', 'CAREER');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_status' and typnamespace = 'public'::regnamespace) then
    create type task_status as enum ('TODO', 'IN_PROGRESS', 'DONE');
  end if;
  if not exists (select 1 from pg_type where typname = 'app_stage' and typnamespace = 'public'::regnamespace) then
    create type app_stage as enum ('RESEARCH', 'APPLIED', 'SCREEN', 'TECHNICAL', 'ONSITE', 'OFFER', 'REJECTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'difficulty' and typnamespace = 'public'::regnamespace) then
    create type difficulty as enum ('EASY', 'MEDIUM', 'HARD');
  end if;
end $$;

-- ---------------------------------------------------------------- profiles
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null,
  role       app_role not null default 'VIEWER',
  created_at timestamptz not null default now()
);

-- Mirror new auth users into profiles.
--
-- The first account to sign in owns the dashboard, so it is created ADMIN.
-- Everyone after that is a VIEWER: this is a personal tracker that mentors
-- read, not a multi-tenant app. Without this the very first sign-in would
-- lock you out of your own data until you promoted yourself by hand.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  first_user boolean;
begin
  select not exists (select 1 from profiles) into first_user;

  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name',
             new.raw_user_meta_data->>'user_name',
             new.email),
    -- The cast is load bearing. A CASE over two bare literals resolves to
    -- text, Postgres will not assign text to an enum column, and without it
    -- every sign up fails with "Database error saving new user".
    (case when first_user then 'ADMIN' else 'VIEWER' end)::app_role
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Accounts that signed in before this file ran have no profile, because the
-- trigger did not exist yet. With no row the app treats you as a VIEWER and
-- refuses every write. Backfill them, and make the oldest account ADMIN if
-- nobody is yet, which is what the trigger would have done.
insert into profiles (id, name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name',
           u.raw_user_meta_data->>'user_name',
           u.email),
  (case
     when not exists (select 1 from profiles where role = 'ADMIN')
      and u.id = (select id from auth.users order by created_at limit 1)
     then 'ADMIN'
     else 'VIEWER'
   end)::app_role
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------- milestones (Gantt rows)
--
-- `key` is the stable identifier the built-in plan links to ('m1'...'m11').
-- The primary key is a uuid so rows behave like every other table, but the
-- app matches plan steps on `key`, so milestone progress keeps working no
-- matter what uuid Postgres hands out.
--
-- Every `user_id` defaults to auth.uid(), so a client insert lands on the
-- signed-in account even if it does not send the column.
create table if not exists milestones (
  id         uuid primary key default gen_random_uuid(),
  key        text,
  title      text not null,
  category   task_category not null,
  phase      text not null,              -- e.g. '2026 - Foundations'
  start_date date not null,
  end_date   date not null,
  progress   smallint not null default 0 check (progress between 0 and 100),
  user_id    uuid not null default auth.uid() references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists milestones_span_idx on milestones (user_id, start_date, end_date);

-- ---------------------------------------------------------------- tasks
create table if not exists tasks (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  detail             text,
  category           task_category not null,
  status             task_status not null default 'TODO',
  due_date           date,
  time_spent_minutes integer not null default 0,
  milestone_id       uuid references milestones(id) on delete set null,
  user_id            uuid not null default auth.uid() references profiles(id) on delete cascade,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists tasks_user_due_idx on tasks (user_id, due_date);
create index if not exists tasks_status_idx   on tasks (status) where status <> 'DONE';

-- ---------------------------------------------------------------- plan progress
--
-- One row per ticked step of the built-in plan. `step_id` is the id from
-- src/lib/data/plan.ts ('s01'...'s28'); the plan itself lives in the code,
-- so only the tick and its date are stored.
create table if not exists plan_progress (
  step_id    text not null,
  user_id    uuid not null default auth.uid() references profiles(id) on delete cascade,
  done_on    date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

-- ---------------------------------------------------------------- time entries
--
-- One row per press of +25m / +50m. Kept separate from tasks.time_spent_minutes
-- so the hours chart has a dated series rather than a running total.
create table if not exists time_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references profiles(id) on delete cascade,
  task_id    uuid references tasks(id) on delete cascade,
  entry_date date not null default current_date,
  minutes    integer not null check (minutes > 0),
  category   task_category not null,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_date_idx on time_entries (user_id, entry_date);

-- ---------------------------------------------------------------- daily metrics (time series)
--
-- Optional. The dashboard derives its charts from time_entries, solved
-- problems and the GitHub API, so this table is only for a future nightly
-- rollup job. Rows here are added to whatever the client derives.
create table if not exists daily_metrics (
  date            date not null,
  user_id         uuid not null default auth.uid() references profiles(id) on delete cascade,
  leetcode_solved integer not null default 0,
  github_commits  integer not null default 0,
  study_hours     numeric(4,2) not null default 0,
  primary key (date, user_id)
);

create index if not exists daily_metrics_range_idx on daily_metrics (user_id, date desc);

-- ---------------------------------------------------------------- DSA problem log
create table if not exists dsa_problems (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,
  title      text not null,
  pattern    text not null,              -- 'Two Pointers', 'Graphs', ...
  level      difficulty not null,
  position   smallint,                   -- teaching order of the NeetCode 150
  solved_at  date,
  user_id    uuid not null default auth.uid() references profiles(id) on delete cascade,
  unique (user_id, slug)
);

create index if not exists dsa_problems_order_idx on dsa_problems (user_id, position);

-- ---------------------------------------------------------------- applications
create table if not exists applications (
  id         uuid primary key default gen_random_uuid(),
  company    text not null,
  role_title text not null,
  stage      app_stage not null default 'RESEARCH',
  applied_on date,
  next_step  text,
  next_due   date,
  notes      text,
  user_id    uuid not null default auth.uid() references profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- academic modules
create table if not exists modules (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,
  title         text not null,
  academic_year text,                    -- '2026-27'
  term          text not null,           -- 'Term 1', 'Term 2' or 'Terms 1 and 2'
  credits       numeric(4,1) not null,   -- ECTS, so a standard module is 7.5
  relevance     smallint not null check (relevance between 1 and 5), -- weight toward the target role
  carry_over    text,                    -- what from this module transfers to the role
  user_id       uuid not null default auth.uid() references profiles(id) on delete cascade,
  unique (user_id, code)
);

-- The exception to leaving existing tables alone. The first version of this
-- table had whole-number credits and no academic year, but the confirmed
-- allocation is in ECTS, where 7.5 is a standard module. On a table that
-- already has the new shape, both statements change nothing.
alter table modules alter column credits type numeric(4,1);
alter table modules add column if not exists academic_year text;

-- ---------------------------------------------------------------- row level security
alter table profiles      enable row level security;
alter table tasks         enable row level security;
alter table milestones    enable row level security;
alter table plan_progress enable row level security;
alter table time_entries  enable row level security;
alter table daily_metrics enable row level security;
alter table dsa_problems  enable row level security;
alter table applications  enable row level security;
alter table modules       enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN');
$$;

-- Everyone signed in reads. Only ADMIN writes. This is the whole RBAC model:
-- one owner, and mentors who can see the work but not change it.
do $$
declare t text;
begin
  foreach t in array array['tasks','milestones','plan_progress','time_entries',
                           'daily_metrics','dsa_problems','applications','modules']
  loop
    execute format('drop policy if exists "read_all_authenticated" on %I;', t);
    execute format('drop policy if exists "write_admin_only" on %I;', t);
    execute format('create policy "read_all_authenticated" on %I for select to authenticated using (true);', t);
    execute format('create policy "write_admin_only"       on %I for all    to authenticated using (is_admin()) with check (is_admin());', t);
  end loop;
end $$;

drop policy if exists "read own profile"   on profiles;
drop policy if exists "update own profile" on profiles;
create policy "read own profile"   on profiles for select to authenticated using (true);
create policy "update own profile" on profiles for update to authenticated using (id = auth.uid());

-- The update policy limits you to your own row, but on its own it would still
-- let a VIEWER run `update profiles set role = 'ADMIN'` on that row from the
-- browser and take over every write policy above. So the client can change
-- its name and nothing else; roles are changed in the dashboard or here.
revoke update on profiles from anon, authenticated;
grant update (name) on profiles to authenticated;

-- ---------------------------------------------------------------- realtime
do $$
declare t text;
begin
  foreach t in array array['tasks','applications','plan_progress','time_entries','dsa_problems']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I;', t);
    end if;
  end loop;
end $$;
