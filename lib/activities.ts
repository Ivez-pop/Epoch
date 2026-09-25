'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'
import { Activity, CreateActivityInput } from './supabase'

export interface ActivityCursor {
  started_at: string
  created_at: string
  id: string
}

function encodeCursor(cursor: ActivityCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}

function decodeCursor(cursorStr: string): ActivityCursor | null {
  try {
    const json = Buffer.from(cursorStr, 'base64url').toString('utf8')
    const parsed = JSON.parse(json)
    if (parsed && parsed.started_at && parsed.created_at && parsed.id) {
      return parsed as ActivityCursor
    }
    return null
  } catch {
    return null
  }
}

export interface SearchActivitiesParams {
  query?: string | null
  subjectId?: string | null
  from?: string | null
  to?: string | null
  cursor?: string | null
  limit?: number
}

export interface SearchActivitiesResult {
  activities: Activity[]
  nextCursor: string | null
  hasMore: boolean
  totalCount: number
}

function parseLocalDateStart(dateStr: string): string | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  const parts = dateStr.split('-').map(Number)
  const d = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function parseLocalDateEnd(dateStr: string): string | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  const parts = dateStr.split('-').map(Number)
  const d = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * Server action to search, filter, and paginate activities for the authenticated user.
 */
export async function searchActivities(
  params: SearchActivitiesParams = {}
): Promise<SearchActivitiesResult> {
  const supabase = await createClient()
  if (!supabase) {
    return { activities: [], nextCursor: null, hasMore: false, totalCount: 0 }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { activities: [], nextCursor: null, hasMore: false, totalCount: 0 }
  }

  const limit = params.limit || 20

  // 1. Validate Subject ownership if subjectId filter is supplied
  if (params.subjectId && params.subjectId.trim()) {
    const subId = params.subjectId.trim()
    const { data: validSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', subId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!validSubject) {
      // Subject does not exist or does not belong to authenticated user
      return { activities: [], nextCursor: null, hasMore: false, totalCount: 0 }
    }
  }

  // 2. Build base query with user scope and search/date/subject filters
  let query = supabase
    .from('activities')
    .select('*, subject:subjects(*)', { count: 'exact' })
    .eq('user_id', user.id)

  if (params.subjectId && params.subjectId.trim()) {
    query = query.eq('subject_id', params.subjectId.trim())
  }

  if (params.query && params.query.trim()) {
    const cleanTerm = params.query.trim().replace(/[,()]/g, ' ')
    if (cleanTerm) {
      query = query.or(`title.ilike.%${cleanTerm}%,description.ilike.%${cleanTerm}%`)
    }
  }

  if (params.from && params.from.trim()) {
    const fromISO = parseLocalDateStart(params.from.trim())
    if (fromISO) {
      query = query.gte('started_at', fromISO)
    }
  }

  if (params.to && params.to.trim()) {
    const toISO = parseLocalDateEnd(params.to.trim())
    if (toISO) {
      query = query.lte('started_at', toISO)
    }
  }

  // 3. Apply composite keyset cursor pagination if provided
  if (params.cursor && params.cursor.trim()) {
    const decodedCursor = decodeCursor(params.cursor.trim())
    if (decodedCursor) {
      const { started_at, created_at, id } = decodedCursor
      query = query.or(
        `started_at.lt.${started_at},and(started_at.eq.${started_at},created_at.lt.${created_at}),and(started_at.eq.${started_at},created_at.eq.${created_at},id.lt.${id})`
      )
    } else {
      // Legacy ISO timestamp cursor fallback
      query = query.lt('started_at', params.cursor.trim())
    }
  }

  // 4. Order strictly by (started_at DESC, created_at DESC, id DESC)
  query = query
    .order('started_at', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error in searchActivities:', error)
    return { activities: [], nextCursor: null, hasMore: false, totalCount: 0 }
  }

  const items = (data as Activity[]) || []
  const hasMore = items.length > limit
  const activities = hasMore ? items.slice(0, limit) : items

  let nextCursor: string | null = null
  if (hasMore && activities.length > 0) {
    const last = activities[activities.length - 1]
    nextCursor = encodeCursor({
      started_at: last.started_at,
      created_at: last.created_at,
      id: last.id,
    })
  }

  return {
    activities,
    nextCursor,
    hasMore,
    totalCount: count || activities.length,
  }
}

/**
 * Server action to fetch all activities for the logged-in user, newest first.
 */
export async function getActivities(): Promise<Activity[]> {
  const res = await searchActivities({ limit: 1000 })
  return res.activities
}

/**
 * Server action to fetch a paginated list of recent activities for the logged-in user.
 */
export async function getRecentActivities(
  limit: number = 20,
  cursorOrPage?: string | number | null
): Promise<{ activities: Activity[]; nextCursor: string | null; hasMore: boolean }> {
  const cursorStr = typeof cursorOrPage === 'string' ? cursorOrPage : null
  const res = await searchActivities({ limit, cursor: cursorStr })
  return {
    activities: res.activities,
    nextCursor: res.nextCursor,
    hasMore: res.hasMore,
  }
}

/**
 * Server action to fetch a single activity by ID for the logged-in user.
 */
export async function getActivity(id: string): Promise<Activity | null> {
  const supabase = await createClient()
  if (!supabase) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*, subject:subjects(*)')
    .eq('id', id)
    .eq('user_id', user.id)
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
  revalidatePath('/profile')
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required.' }
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
    .eq('user_id', user.id)
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
  revalidatePath('/profile')
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required.' }
  }

  // Fetch activity to revalidate its subject page
  const { data: activity } = await supabase
    .from('activities')
    .select('subject_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = await supabase.from('activities').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    console.error('Error deleting activity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/subjects')
  revalidatePath('/history')
  revalidatePath('/profile')
  if (activity?.subject_id) {
    revalidatePath(`/subjects/${activity.subject_id}`)
  }

  return { success: true }
}
