-- ═══════════════════════════════════════════════════════════
--  WEEKENDR — Supabase Schema
--  Paste this into your Supabase project → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

-- ── Users ──────────────────────────────────────────────────
create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text unique not null,
  partner_name text,
  created_at   timestamptz default now()
);

-- ── Preferences ────────────────────────────────────────────
create table if not exists preferences (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade,
  suburb         text not null default 'Melbourne',
  interests      text[] default '{}',
  budget         text not null default 'medium',
  party_size     int not null default 2,
  dietary_notes  text default '',
  mobility_notes text default '',
  other_notes    text default '',
  delivery_hour  int not null default 18,
  updated_at     timestamptz default now(),
  unique (user_id)
);

-- ── Weekend plans ───────────────────────────────────────────
create table if not exists weekend_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id) on delete cascade,
  week_starting date not null,
  plans         jsonb not null,
  weather       jsonb,
  created_at    timestamptz default now(),
  unique (user_id, week_starting)
);

-- ── Weekend memories (memory wall) ─────────────────────────
create table if not exists weekend_memories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id) on delete cascade,
  week_starting date not null,
  plan_name     text not null,
  plan_emoji    text not null,
  reaction      text not null check (reaction in ('loved','good','meh')),
  highlight     text,
  created_at    timestamptz default now(),
  unique (user_id, week_starting)
);

-- ── Row Level Security ──────────────────────────────────────
-- Users can only read/write their own data

alter table users           enable row level security;
alter table preferences     enable row level security;
alter table weekend_plans   enable row level security;
alter table weekend_memories enable row level security;

-- Service role bypasses RLS (used by API routes)
-- Anon key policies below (used by browser client for reads)

create policy "Users read own profile"
  on users for select using (auth.uid() = id);

create policy "Users read own preferences"
  on preferences for select using (
    auth.uid() = user_id
  );

create policy "Users read own plans"
  on weekend_plans for select using (
    auth.uid() = user_id
  );

create policy "Users read own memories"
  on weekend_memories for select using (
    auth.uid() = user_id
  );

-- ── Indexes ─────────────────────────────────────────────────
create index if not exists idx_preferences_user     on preferences(user_id);
create index if not exists idx_plans_user_week      on weekend_plans(user_id, week_starting desc);
create index if not exists idx_memories_user        on weekend_memories(user_id, week_starting desc);
