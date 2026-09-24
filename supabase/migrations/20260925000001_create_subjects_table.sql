-- Supabase migration for Epoch - Slice 2: Subjects

create table if not exists subjects (
    id uuid primary key default gen_random_uuid(),

    name text not null unique,

    color text,

    created_at timestamptz not null default now()
);

-- Add subject_id reference to activities
alter table activities
add column if not exists subject_id uuid references subjects(id) on delete set null;

-- Enable RLS and grant public access for Slice 2
alter table subjects enable row level security;

create policy "Allow public select access on subjects"
    on subjects for select
    using (true);

create policy "Allow public insert access on subjects"
    on subjects for insert
    with check (true);

create policy "Allow public update access on subjects"
    on subjects for update
    using (true);

create policy "Allow public delete access on subjects"
    on subjects for delete
    using (true);
