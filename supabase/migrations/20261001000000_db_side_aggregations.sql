-- Migration: Performance Slice 2 — Database-Side Aggregations

-- 1. Index for user-scoped activity queries by subject
create index if not exists idx_activities_user_subject
on activities (user_id, subject_id);

-- 2. Function: get_user_subjects_with_stats
create or replace function get_user_subjects_with_stats()
returns table (
  id uuid,
  name text,
  color text,
  created_at timestamptz,
  total_duration_seconds bigint,
  activity_count bigint
)
language sql
security invoker
set search_path = public
as $$
  select 
    s.id,
    s.name,
    s.color,
    s.created_at,
    coalesce(sum(a.duration_seconds), 0)::bigint as total_duration_seconds,
    coalesce(count(a.id), 0)::bigint as activity_count
  from subjects s
  left join activities a on a.subject_id = s.id and a.user_id = auth.uid()
  where s.user_id = auth.uid()
  group by s.id, s.name, s.color, s.created_at
  order by total_duration_seconds desc, s.name asc;
$$;

-- 3. Function: get_daily_activity_summary
create or replace function get_daily_activity_summary(p_year integer)
returns table (
  date_key text,
  total_duration_seconds bigint,
  activity_count bigint
)
language sql
security invoker
set search_path = public
as $$
  select
    to_char(started_at, 'YYYY-MM-DD') as date_key,
    coalesce(sum(duration_seconds), 0)::bigint as total_duration_seconds,
    count(*)::bigint as activity_count
  from activities
  where user_id = auth.uid()
    and started_at >= (to_date(p_year::text || '-01-01', 'YYYY-MM-DD') - interval '2 days')
    and started_at <= (to_date(p_year::text || '-12-31', 'YYYY-MM-DD') + interval '2 days')
  group by to_char(started_at, 'YYYY-MM-DD')
  order by date_key asc;
$$;

-- 4. Function: get_user_profile_stats
create or replace function get_user_profile_stats()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_duration bigint := 0;
  v_activity_count bigint := 0;
  v_active_days bigint := 0;
  v_subject_count bigint := 0;
  v_top_subjects jsonb := '[]'::jsonb;
  v_duration_30d bigint := 0;
  v_active_days_30d bigint := 0;
  v_duration_7d bigint := 0;
  v_streak int := 0;
  v_check_date date;
  v_has_activity boolean;
  v_now_date date := CURRENT_DATE;
begin
  if v_user_id is null then
    return jsonb_build_object(
      'total_duration_seconds', 0,
      'active_days', 0,
      'activity_count', 0,
      'subject_count', 0,
      'top_subjects', '[]'::jsonb,
      'daily_average_30d_seconds', 0,
      'consistency_rate_30d', 0,
      'weekly_focus_seconds', 0,
      'current_streak_days', 0
    );
  end if;

  -- Total duration, activity count, distinct active days
  select
    coalesce(sum(duration_seconds), 0),
    count(*),
    count(distinct to_char(started_at, 'YYYY-MM-DD'))
  into v_total_duration, v_activity_count, v_active_days
  from activities
  where user_id = v_user_id;

  -- 30d duration & 30d active days
  select
    coalesce(sum(duration_seconds), 0),
    count(distinct to_char(started_at, 'YYYY-MM-DD'))
  into v_duration_30d, v_active_days_30d
  from activities
  where user_id = v_user_id
    and started_at >= (now() - interval '29 days');

  -- 7d duration
  select coalesce(sum(duration_seconds), 0)
  into v_duration_7d
  from activities
  where user_id = v_user_id
    and started_at >= (now() - interval '6 days');

  -- Subject count
  select count(*)
  into v_subject_count
  from subjects
  where user_id = v_user_id;

  -- Top subjects
  select coalesce(jsonb_agg(sub_item order by (sub_item->>'total_duration_seconds')::bigint desc), '[]'::jsonb)
  into v_top_subjects
  from (
    select jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'color', s.color,
      'total_duration_seconds', coalesce(sum(a.duration_seconds), 0),
      'activity_count', coalesce(count(a.id), 0)
    ) as sub_item
    from subjects s
    left join activities a on a.subject_id = s.id and a.user_id = v_user_id
    where s.user_id = v_user_id
    group by s.id, s.name, s.color
    order by coalesce(sum(a.duration_seconds), 0) desc
  ) top_subs;

  -- Streak calculation
  select exists(
    select 1 from activities
    where user_id = v_user_id
      and to_char(started_at, 'YYYY-MM-DD') = to_char(v_now_date, 'YYYY-MM-DD')
  ) into v_has_activity;

  if v_has_activity then
    v_check_date := v_now_date;
  else
    v_check_date := v_now_date - interval '1 day';
  end if;

  while exists(
    select 1 from activities
    where user_id = v_user_id
      and to_char(started_at, 'YYYY-MM-DD') = to_char(v_check_date, 'YYYY-MM-DD')
  ) loop
    v_streak := v_streak + 1;
    v_check_date := v_check_date - interval '1 day';
  end loop;

  return jsonb_build_object(
    'total_duration_seconds', v_total_duration,
    'active_days', v_active_days,
    'activity_count', v_activity_count,
    'subject_count', v_subject_count,
    'top_subjects', v_top_subjects,
    'daily_average_30d_seconds', round(v_duration_30d::numeric / 30.0),
    'consistency_rate_30d', round((v_active_days_30d::numeric / 30.0) * 100.0, 1),
    'weekly_focus_seconds', v_duration_7d,
    'current_streak_days', v_streak
  );
end;
$$;
