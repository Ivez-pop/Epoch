import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface Subject {
  id: string
  name: string
  color: string | null
  created_at: string
}

export interface SubjectWithTime extends Subject {
  total_duration_seconds: number
  activity_count: number
}

export interface Activity {
  id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  title: string | null
  description: string | null
  subject_id: string | null
  subject?: Subject | null
  created_at: string
}

export interface CreateActivityInput {
  started_at: string
  ended_at: string
  duration_seconds: number
  title?: string | null
  description?: string | null
  subject_id: string
}

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase')) {
    return null
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
