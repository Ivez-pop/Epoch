-- Supabase migration for Epoch - Slice 1: Core Activity Loop

create table if not exists activities (
    id uuid primary key default gen_random_uuid(),

    started_at timestamptz not null,
    ended_at timestamptz,

    duration_seconds integer,

    title text,
    description text,

    created_at timestamptz not null default now()
);

-- Enable RLS and grant public access for Slice 1
alter table activities enable row level security;

create policy "Allow public select access on activities"
    on activities for select
    using (true);

create policy "Allow public insert access on activities"
    on activities for insert
    with check (true);

create policy "Allow public update access on activities"
    on activities for update
    using (true);

create policy "Allow public delete access on activities"
    on activities for delete
    using (true);
