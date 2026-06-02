-- Schema already applied to Supabase project rjgeoingulhmvgruphjv.
-- Keep this file as backup/reference.

create extension if not exists pgcrypto;

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  energy text not null default 'Yellow Day',
  study_area text not null,
  learning_type text not null default 'Self Study',
  source_name text,
  source_link text,
  topic text not null,
  subtopic text,
  status text not null default 'In Progress',
  problems_done integer not null default 0 check (problems_done >= 0),
  study_hours numeric(5,2) not null default 0 check (study_hours >= 0),
  byc_minutes integer not null default 0 check (byc_minutes >= 0),
  confidence text not null default 'Medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flexible_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  area text not null,
  topic text not null,
  planned_phase text default 'Flexible',
  source text default 'Roadmap',
  source_name text,
  class_status text not null default 'Not Started',
  mastery_status text not null default 'Not Started',
  target_problems integer not null default 0 check (target_problems >= 0),
  problems_done integer not null default 0 check (problems_done >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.byc_lab_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  task text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
