-- Supabase migration for Epoch - Slice 6: Authentication & User-Owned Data

-- 1. Create minimal profiles table
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can select own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 2. Add user_id column to subjects and activities
alter table subjects
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table activities
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 3. Replace global unique constraint on subjects(name) with composite constraint (user_id, name)
alter table subjects drop constraint if exists subjects_name_key;
alter table subjects add constraint subjects_user_id_name_key unique (user_id, name);

-- 4. Remove prototype public access RLS policies
drop policy if exists "Allow public select access on activities" on activities;
drop policy if exists "Allow public insert access on activities" on activities;
drop policy if exists "Allow public update access on activities" on activities;
drop policy if exists "Allow public delete access on activities" on activities;

drop policy if exists "Allow public select access on subjects" on subjects;
drop policy if exists "Allow public insert access on subjects" on subjects;
drop policy if exists "Allow public update access on subjects" on subjects;
drop policy if exists "Allow public delete access on subjects" on subjects;

-- 5. Create user-scoped RLS policies for subjects
create policy "Users can select own subjects" on subjects for select using (auth.uid() = user_id);
create policy "Users can insert own subjects" on subjects for insert with check (auth.uid() = user_id);
create policy "Users can update own subjects" on subjects for update using (auth.uid() = user_id);
create policy "Users can delete own subjects" on subjects for delete using (auth.uid() = user_id);

-- 6. Create user-scoped RLS policies for activities
create policy "Users can select own activities" on activities for select using (auth.uid() = user_id);
create policy "Users can insert own activities" on activities for insert with check (auth.uid() = user_id);
create policy "Users can update own activities" on activities for update using (auth.uid() = user_id);
create policy "Users can delete own activities" on activities for delete using (auth.uid() = user_id);
