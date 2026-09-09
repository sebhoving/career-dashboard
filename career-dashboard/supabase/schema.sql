-- Career transition dashboard schema.
-- Run in the Supabase SQL editor, or `supabase db push`.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------- enums
create type app_role      as enum ('ADMIN', 'VIEWER');
create type task_category as enum ('DSA', 'PYTORCH', 'PHYSICS', 'CAREER');
create type task_status   as enum ('TODO', 'IN_PROGRESS', 'DONE');
create type app_stage     as enum ('RESEARCH', 'APPLIED', 'SCREEN', 'TECHNICAL', 'ONSITE', 'OFFER', 'REJECTED');
create type difficulty    as enum ('EASY', 'MEDIUM', 'HARD');

-- ---------------------------------------------------------------- profiles
create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null,
  role       app_role not null default 'VIEWER',
  created_at timestamptz not null default now()
);

-- Mirror new auth users into profiles.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), 'VIEWER');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------- milestones (Gantt rows)
create table milestones (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  category   task_category not null,
  phase      text not null,              -- e.g. 'Year 2 - Foundations'
  start_date date not null,
  end_date   date not null,
  progress   smallint not null default 0 check (progress between 0 and 100),
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index milestones_span_idx on milestones (user_id, start_date, end_date);

-- ---------------------------------------------------------------- tasks
create table tasks (
  id                 uuid primary key default uuid_generate_v4(),
  title              text not null,
  detail             text,
  category           task_category not null,
  status             task_status not null default 'TODO',
  due_date           timestamptz,
  time_spent_minutes integer not null default 0,
  milestone_id       uuid references milestones(id) on delete set null,
  user_id            uuid not null references profiles(id) on delete cascade,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index tasks_user_due_idx  on tasks (user_id, due_date);
create index tasks_status_idx    on tasks (status) where status <> 'DONE';
create index tasks_title_trgm    on tasks using gin (to_tsvector('english', title));

-- ---------------------------------------------------------------- daily metrics (time series)
create table daily_metrics (
  date            date not null,
  user_id         uuid not null references profiles(id) on delete cascade,
  leetcode_solved integer not null default 0,
  github_commits  integer not null default 0,
  study_hours     numeric(4,2) not null default 0,
  primary key (date, user_id)
);

-- Three years of daily rows is small, but the dashboard always queries a window.
create index daily_metrics_range_idx on daily_metrics (user_id, date desc);

-- ---------------------------------------------------------------- DSA problem log
create table dsa_problems (
  id         uuid primary key default uuid_generate_v4(),
  slug       text not null,
  title      text not null,
  pattern    text not null,              -- 'Two Pointers', 'Graphs', ...
  level      difficulty not null,
  solved_at  date,
  user_id    uuid not null references profiles(id) on delete cascade,
  unique (user_id, slug)
);

-- ---------------------------------------------------------------- applications
create table applications (
  id         uuid primary key default uuid_generate_v4(),
  company    text not null,
  role_title text not null,
  stage      app_stage not null default 'RESEARCH',
  applied_on date,
  next_step  text,
  next_due   date,
  notes      text,
  user_id    uuid not null references profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- academic modules
create table modules (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null,
  title       text not null,
  term        text not null,
  credits     smallint not null,
  relevance   smallint not null check (relevance between 1 and 5), -- weight toward the target role
  carry_over  text,                      -- what from this module transfers to the role
  user_id     uuid not null references profiles(id) on delete cascade
);

-- ---------------------------------------------------------------- row level security
alter table profiles      enable row level security;
alter table tasks         enable row level security;
alter table milestones    enable row level security;
alter table daily_metrics enable row level security;
alter table dsa_problems  enable row level security;
alter table applications  enable row level security;
alter table modules       enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN');
$$;

-- Everyone signed in reads. Only ADMIN writes. This is the whole RBAC model.
do $$
declare t text;
begin
  foreach t in array array['tasks','milestones','daily_metrics','dsa_problems','applications','modules']
  loop
    execute format('create policy "read_all_authenticated" on %I for select to authenticated using (true);', t);
    execute format('create policy "write_admin_only"       on %I for all    to authenticated using (is_admin()) with check (is_admin());', t);
  end loop;
end $$;

create policy "read own profile"  on profiles for select to authenticated using (true);
create policy "update own profile" on profiles for update to authenticated using (id = auth.uid());

-- ---------------------------------------------------------------- realtime
alter publication supabase_realtime add table tasks, milestones, daily_metrics, applications;
