'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'
import { getUser } from './auth'
import { getSubjects } from './subjects'
import { SubjectWithTime } from './supabase'

export interface Profile {
  id: string
  display_name: string | null
  created_at: string
}

export interface ProfileStats {
  total_duration_seconds: number
  active_days: number
  activity_count: number
  subject_count: number
  top_subjects: {
    id: string
    name: string
    color: string | null
    total_duration_seconds: number
    activity_count?: number
  }[]
  daily_average_30d_seconds: number
  consistency_rate_30d: number
  weekly_focus_seconds: number
  current_streak_days: number
}

/**
 * Fetch profile data and auth identity for the logged-in user.
 */
export async function getProfile(): Promise<{
  profile: Profile | null
  userEmail: string
  createdAt: string
  displayName: string
}> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      profile: null,
      userEmail: '',
      createdAt: new Date().toISOString(),
      displayName: 'User',
    }
  }

  const user = await getUser()

  if (!user) {
    return {
      profile: null,
      userEmail: '',
      createdAt: new Date().toISOString(),
      displayName: 'User',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const userEmail = user.email || ''
  const fallbackName = userEmail ? userEmail.split('@')[0] : 'User'
  const displayName = profile?.display_name?.trim() ? profile.display_name.trim() : fallbackName

  return {
    profile: profile as Profile | null,
    userEmail,
    createdAt: profile?.created_at || user.created_at || new Date().toISOString(),
    displayName,
  }
}

/**
 * Update display name for the logged-in user.
 */
export async function updateProfile(
  displayName: string
): Promise<{ success: boolean; data?: Profile; error?: string }> {
  const trimmed = displayName.trim().replace(/<[^>]*>?/gm, '') // Strip HTML tags

  if (!trimmed) {
    return { success: false, error: 'Display name cannot be empty.' }
  }

  if (trimmed.length > 50) {
    return { success: false, error: 'Display name must be 50 characters or less.' }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase credentials are not configured.' }
  }

  const user = await getUser()

  if (!user) {
    return { success: false, error: 'Authentication required.' }
  }

  const payload = {
    id: user.id,
    display_name: trimmed,
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert([payload], { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/')
  return { success: true, data: data as Profile }
}

/**
 * Calculate personal profile statistics for the logged-in user derived from database activities and subjects.
 */
export async function getProfileStats(preFetchedSubjects?: SubjectWithTime[]): Promise<ProfileStats> {
  const supabase = await createClient()
  const defaultStats: ProfileStats = {
    total_duration_seconds: 0,
    active_days: 0,
    activity_count: 0,
    subject_count: 0,
    top_subjects: [],
    daily_average_30d_seconds: 0,
    consistency_rate_30d: 0,
    weekly_focus_seconds: 0,
    current_streak_days: 0,
  }

  if (!supabase) return defaultStats

  const user = await getUser()
  if (!user) return defaultStats

  // Try PostgreSQL RPC function first (Database-side aggregation)
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile_stats')

  if (!rpcError && rpcData) {
    const res = rpcData as any
    const topSubjects = preFetchedSubjects
      ? preFetchedSubjects.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          total_duration_seconds: s.total_duration_seconds,
          activity_count: s.activity_count,
        }))
      : ((res.top_subjects || []) as any[]).map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          total_duration_seconds: Number(s.total_duration_seconds || 0),
          activity_count: Number(s.activity_count || 0),
        }))

    return {
      total_duration_seconds: Number(res.total_duration_seconds || 0),
      active_days: Number(res.active_days || 0),
      activity_count: Number(res.activity_count || 0),
      subject_count: Number(res.subject_count || 0),
      top_subjects: topSubjects,
      daily_average_30d_seconds: Number(res.daily_average_30d_seconds || 0),
      consistency_rate_30d: Number(res.consistency_rate_30d || 0),
      weekly_focus_seconds: Number(res.weekly_focus_seconds || 0),
      current_streak_days: Number(res.current_streak_days || 0),
    }
  }

  // Fallback if RPC is not present
  const subjects = preFetchedSubjects ?? (await getSubjects())
  const subjectCount = subjects.length
  const topSubjects = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    total_duration_seconds: s.total_duration_seconds,
    activity_count: s.activity_count,
  }))

  const { data: activitiesData } = await supabase
    .from('activities')
    .select('started_at, duration_seconds')
    .eq('user_id', user.id)

  let totalDuration = 0
  let activityCount = 0
  const activeDaysSet = new Set<string>()

  const now = new Date()
  const date30DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0)
  const date7DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0)

  let duration30Days = 0
  const activeDays30Set = new Set<string>()
  let duration7Days = 0

  if (activitiesData) {
    for (const act of activitiesData) {
      const dur = act.duration_seconds || 0
      totalDuration += dur
      activityCount += 1

      if (act.started_at) {
        const d = new Date(act.started_at)
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`
        activeDaysSet.add(dateKey)

        if (d >= date30DaysAgo) {
          duration30Days += dur
          activeDays30Set.add(dateKey)
        }

        if (d >= date7DaysAgo) {
          duration7Days += dur
        }
      }
    }
  }

  const dailyAverage30d = Math.round(duration30Days / 30)
  const consistencyRate30d = Math.round((activeDays30Set.size / 30) * 100 * 10) / 10

  let streak = 0
  const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(checkDate.getDate()).padStart(2, '0')}`

  if (!activeDaysSet.has(checkKey)) {
    checkDate.setDate(checkDate.getDate() - 1)
    checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(checkDate.getDate()).padStart(2, '0')}`
  }

  while (activeDaysSet.has(checkKey)) {
    streak += 1
    checkDate.setDate(checkDate.getDate() - 1)
    checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(checkDate.getDate()).padStart(2, '0')}`
  }

  return {
    total_duration_seconds: totalDuration,
    active_days: activeDaysSet.size,
    activity_count: activityCount,
    subject_count: subjectCount,
    top_subjects: topSubjects,
    daily_average_30d_seconds: dailyAverage30d,
    consistency_rate_30d: consistencyRate30d,
    weekly_focus_seconds: duration7Days,
    current_streak_days: streak,
  }
}
