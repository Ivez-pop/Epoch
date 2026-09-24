'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'
import { Activity, CreateActivityInput } from './supabase'

/**
 * Server action to fetch all activities for the logged-in user, newest first.
 */
export async function getActivities(): Promise<Activity[]> {
  const supabase = await createClient()
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
 * Server action to fetch a single activity by ID for the logged-in user.
 */
export async function getActivity(id: string): Promise<Activity | null> {
  const supabase = await createClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*, subject:subjects(*)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching activity by ID:', error)
    return null
  }

  return data as Activity
}

/**
 * Server action to create a new activity record attached to current authenticated user.
 */
export async function createActivity(
  input: CreateActivityInput
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase credentials are not configured.',
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required to create activity.' }
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
    user_id: user.id,
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
  revalidatePath('/history')
  if (input.subject_id) {
    revalidatePath(`/subjects/${input.subject_id}`)
  }

  return { success: true, data: data as Activity }
}

/**
 * Server action to update an existing activity (Subject, Title, Description only).
 * Historical timestamps (started_at, ended_at, duration_seconds) remain immutable.
 */
export async function updateActivity(
  id: string,
  input: {
    subject_id: string
    title?: string | null
    description?: string | null
  }
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  const supabase = await createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase credentials are not configured.' }
  }

  if (!input.subject_id) {
    return { success: false, error: 'Subject is required.' }
  }

  const payload = {
    subject_id: input.subject_id,
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
  }

  const { data, error } = await supabase
    .from('activities')
    .update(payload)
    .eq('id', id)
    .select('*, subject:subjects(*)')
    .single()

  if (error) {
    console.error('Error updating activity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/activity/${id}`)
  revalidatePath('/')
  revalidatePath('/subjects')
  revalidatePath('/history')
  if (input.subject_id) {
    revalidatePath(`/subjects/${input.subject_id}`)
  }

  return { success: true, data: data as Activity }
}

/**
 * Server action to permanently delete an activity by ID.
 */
export async function deleteActivity(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase credentials are not configured.' }
  }

  // Fetch activity to revalidate its subject page
  const { data: activity } = await supabase
    .from('activities')
    .select('subject_id')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('activities').delete().eq('id', id)

  if (error) {
    console.error('Error deleting activity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/subjects')
  revalidatePath('/history')
  if (activity?.subject_id) {
    revalidatePath(`/subjects/${activity.subject_id}`)
  }

  return { success: true }
}
