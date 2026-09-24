'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseClient, Subject, SubjectWithTime, Activity } from './supabase'

/**
 * Fetch all subjects with accumulated total time in seconds calculated from activities.
 * Ordered by total accumulated activity time descending.
 */
export async function getSubjects(): Promise<SubjectWithTime[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  const { data: subjectsData, error: subjectsError } = await supabase
    .from('subjects')
    .select('*')

  if (subjectsError) {
    console.error('Error fetching subjects:', subjectsError)
    return []
  }

  const { data: activitiesData, error: activitiesError } = await supabase
    .from('activities')
    .select('subject_id, duration_seconds')

  if (activitiesError) {
    console.error('Error fetching activity durations:', activitiesError)
  }

  // Calculate sum of duration_seconds for each subject
  const timeMap: Record<string, { total: number; count: number }> = {}
  if (activitiesData) {
    for (const act of activitiesData) {
      if (act.subject_id && act.duration_seconds) {
        if (!timeMap[act.subject_id]) {
          timeMap[act.subject_id] = { total: 0, count: 0 }
        }
        timeMap[act.subject_id].total += act.duration_seconds
        timeMap[act.subject_id].count += 1
      }
    }
  }

  const subjectsWithTime: SubjectWithTime[] = (subjectsData || []).map((sub: Subject) => ({
    ...sub,
    total_duration_seconds: timeMap[sub.id]?.total || 0,
    activity_count: timeMap[sub.id]?.count || 0,
  }))

  // Order subjects by accumulated activity time descending
  subjectsWithTime.sort((a, b) => b.total_duration_seconds - a.total_duration_seconds)

  return subjectsWithTime
}

/**
 * Fetch a single subject by ID with total accumulated time.
 */
export async function getSubject(id: string): Promise<SubjectWithTime | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: sub, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !sub) return null

  const { data: activitiesData } = await supabase
    .from('activities')
    .select('duration_seconds')
    .eq('subject_id', id)

  let total = 0
  let count = 0
  if (activitiesData) {
    for (const act of activitiesData) {
      if (act.duration_seconds) {
        total += act.duration_seconds
        count += 1
      }
    }
  }

  return {
    ...sub,
    total_duration_seconds: total,
    activity_count: count,
  }
}

/**
 * Create a new subject with unique name validation and optional color.
 */
export async function createSubject(
  name: string,
  color?: string | null
): Promise<{ success: boolean; data?: Subject; error?: string }> {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return { success: false, error: 'Subject name is required.' }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase credentials are not configured.',
    }
  }

  // Check if subject with same name already exists
  const { data: existing } = await supabase
    .from('subjects')
    .select('id')
    .ilike('name', trimmedName)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'A subject with this name already exists.' }
  }

  const payload = {
    name: trimmedName,
    color: color?.trim() || null,
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert([payload])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A subject with this name already exists.' }
    }
    console.error('Error creating subject:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/subjects')
  revalidatePath('/')
  return { success: true, data: data as Subject }
}

/**
 * Delete a subject by ID.
 */
export async function deleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { success: false, error: 'Supabase credentials are not configured.' }

  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/subjects')
  revalidatePath('/')
  return { success: true }
}

/**
 * Get total activity duration seconds for a subject.
 */
export async function getSubjectActivityTime(subjectId: string): Promise<number> {
  const supabase = getSupabaseClient()
  if (!supabase) return 0

  const { data } = await supabase
    .from('activities')
    .select('duration_seconds')
    .eq('subject_id', subjectId)

  if (!data) return 0
  return data.reduce((sum, act) => sum + (act.duration_seconds || 0), 0)
}

/**
 * Get all activities for a subject, newest first.
 */
export async function getSubjectActivities(subjectId: string): Promise<Activity[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('activities')
    .select('*, subject:subjects(*)')
    .eq('subject_id', subjectId)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching subject activities:', error)
    return []
  }

  return (data as Activity[]) || []
}
