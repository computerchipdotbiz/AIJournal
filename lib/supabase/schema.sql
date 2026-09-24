-- ==============================================================================
-- ROSEBUD-STYLE AI JOURNAL DATABASE SCHEMA (SUPABASE POSTGRESQL + PGVECTOR)
-- ==============================================================================
-- Run this entire script in your Supabase Dashboard -> SQL Editor -> Click 'Run'.

-- 1. Enable pgvector extension for AI semantic memory
create extension if not exists vector;

-- 2. Create Entries Table
create table if not exists public.entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  date date not null default current_date,
  content text not null,                     -- Aggregated full writing
  summary text,                              -- AI generated 1-2 sentence overview
  mood_score int check (mood_score between 1 and 10),
  emotions text[] default '{}',              -- e.g. ['anxious', 'hopeful', 'grateful']
  tags text[] default '{}',                  -- e.g. ['work', 'health', 'mindset']
  action_items text[] default '{}',          -- Actionable commitments
  conversation jsonb default '[]'::jsonb,    -- Full multi-turn transcript
  prompt_used text,
  embedding vector(768),                     -- Gemini 768-dim embedding (or 1536 for OpenAI)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for speedy date and user lookups
create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_date_idx on public.entries(date desc);

-- 3. Create Weekly Insights Table
create table if not exists public.weekly_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  title text not null,
  summary text not null,
  top_themes text[] default '{}',
  growth_areas text[] default '{}',
  wins text[] default '{}',
  key_mindset_shift text,
  recommended_focus text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS) for complete privacy
alter table public.entries enable row level security;
alter table public.weekly_insights enable row level security;

-- Policies: Only the authenticated user can read/write their own entries
create policy "Users can manage their own entries"
  on public.entries
  for all
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can manage their own insights"
  on public.weekly_insights
  for all
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- 5. Semantic Memory Match Function
-- Matches past entries most relevant to current thought
create or replace function match_entries (
  query_embedding vector(768),
  match_threshold float default 0.65,
  match_count int default 3,
  p_user_id uuid default null
)
returns table (
  id uuid,
  title text,
  summary text,
  date date,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    entries.id,
    entries.title,
    entries.summary,
    entries.date,
    1 - (entries.embedding <=> query_embedding) as similarity
  from entries
  where (p_user_id is null or entries.user_id = p_user_id)
    and entries.embedding is not null
    and 1 - (entries.embedding <=> query_embedding) > match_threshold
  order by entries.embedding <=> query_embedding
  limit match_count;
end;
$$;
