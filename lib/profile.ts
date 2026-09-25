'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'
import { getSubjects } from './subjects'

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
  }[]
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
export async function getProfileStats(): Promise<ProfileStats> {
  const supabase = await createClient()
  const defaultStats: ProfileStats = {
    total_duration_seconds: 0,
    active_days: 0,
    activity_count: 0,
    subject_count: 0,
    top_subjects: [],
  }

  if (!supabase) return defaultStats

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return defaultStats

  // Reuse existing subject aggregation logic from lib/subjects.ts
  const subjects = await getSubjects()
  const subjectCount = subjects.length
  const topSubjects = subjects.slice(0, 5).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    total_duration_seconds: s.total_duration_seconds,
  }))

  // Query user-owned activities for duration, count, and active days
  const { data: activitiesData } = await supabase
    .from('activities')
    .select('started_at, duration_seconds')
    .eq('user_id', user.id)

  let totalDuration = 0
  let activityCount = 0
  const activeDaysSet = new Set<string>()

  if (activitiesData) {
    for (const act of activitiesData) {
      if (act.duration_seconds) {
        totalDuration += act.duration_seconds
        activityCount += 1
      }

      if (act.started_at) {
        const d = new Date(act.started_at)
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`
        activeDaysSet.add(dateKey)
      }
    }
  }

  return {
    total_duration_seconds: totalDuration,
    active_days: activeDaysSet.size,
    activity_count: activityCount,
    subject_count: subjectCount,
    top_subjects: topSubjects,
  }
}
