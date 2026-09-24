'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseClient, Activity, CreateActivityInput } from './supabase'

/**
 * Server action to fetch all activities, newest first, including associated Subject.
 */
export async function getActivities(): Promise<Activity[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*, subject:subjects(*)')
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching activities:', error)
    return []
  }

  return (data as Activity[]) || []
}

/**
 * Server action to create a new activity record. Requires subject_id for new activities.
 */
export async function createActivity(
  input: CreateActivityInput
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase credentials are not configured. Please populate NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    }
  }

  if (!input.subject_id) {
    return { success: false, error: 'Please select a subject.' }
  }

  const payload = {
    started_at: input.started_at,
    ended_at: input.ended_at,
    duration_seconds: Math.max(1, Math.round(input.duration_seconds)),
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
    subject_id: input.subject_id,
  }

  const { data, error } = await supabase
    .from('activities')
    .insert([payload])
    .select('*, subject:subjects(*)')
    .single()

  if (error) {
    console.error('Error creating activity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/subjects')
  if (input.subject_id) {
    revalidatePath(`/subjects/${input.subject_id}`)
  }

  return { success: true, data: data as Activity }
}
