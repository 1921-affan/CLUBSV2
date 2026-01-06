-- 1. Create the NoSQL Table (ai_interactions)
-- This table uses a JSONB column (raw_data) to store unstructured AI data.

create table if not exists ai_interactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  raw_data jsonb not null,  -- <--- THIS IS THE NoSQL PART
  feature_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Security Setup (Row Level Security)
-- This ensures users can only see/add their own data.

alter table ai_interactions enable row level security;

-- Policy: Allow users to insert their own logs
create policy "Users can insert their own AI logs"
  on ai_interactions for insert
  with check (auth.uid() = user_id);

-- Policy: Allow users to view their own logs
create policy "Users can view their own AI logs"
  on ai_interactions for select
  using (auth.uid() = user_id);
