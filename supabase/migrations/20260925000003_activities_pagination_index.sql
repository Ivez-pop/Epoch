-- Supabase migration for Epoch - Slice 7: Pagination Index

-- Index for user-scoped, chronologically ordered activity feed queries
create index if not exists idx_activities_user_started_at
on activities (user_id, started_at desc, created_at desc);

-- Index for user-scoped subjects query
create index if not exists idx_subjects_user_id
on subjects (user_id);
