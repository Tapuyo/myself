-- Run once in the Supabase SQL editor for this project.
-- Exactly 2 tables: call_sessions and contacts. No rate_limits table —
-- the daily call cap is enforced by counting rows in call_sessions directly.

create extension if not exists pgcrypto;

create table if not exists call_sessions (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  visitor_name text,
  visitor_email text,
  summary text,
  transcript text,
  created_at timestamptz not null default now()
);

create index if not exists idx_call_sessions_iphash_started
  on call_sessions (ip_hash, started_at);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table call_sessions enable row level security;
alter table contacts enable row level security;

-- Default-deny: no policies for anon/authenticated roles are created here.
-- All reads/writes go through the Vercel serverless functions using
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely. This means even a
-- leaked anon key can't touch these tables.
