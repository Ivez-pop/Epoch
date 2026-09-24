'use server'

import { createClient } from './supabase/server'
import { Activity } from './supabase'

export interface DailyActivitySummary {
  date: string // YYYY-MM-DD
  total_duration_seconds: number
  activity_count: number
}

export interface YearActivitySummary {
  year: number
  total_duration_seconds: number
  active_days: number
  activity_count: number
  longest_day: {
    date: string
    total_duration_seconds: number
    activity_count: number
  } | null
}

/**
 * Format ISO timestamp to local YYYY-MM-DD date string.
 */
function getLocalDateString(isoString: string): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Fetch daily activity aggregation map for the logged-in user for a specific calendar year.
 */
export async function getActivityHistory(year: number): Promise<Record<string, DailyActivitySummary>> {
  const supabase = await createClient()
  if (!supabase) return {}

  // Fetch activities with a 1-day buffer on each side to account for timezone offsets
  const startBound = `${year - 1}-12-30T00:00:00.000Z`
  const endBound = `${year + 1}-01-02T23:59:59.999Z`

  const { data, error } = await supabase
    .from('activities')
    .select('started_at, duration_seconds')
    .gte('started_at', startBound)
    .lte('started_at', endBound)

  if (error || !data) {
    if (error) console.error('Error fetching activity history:', error)
    return {}
  }

  const historyMap: Record<string, DailyActivitySummary> = {}

  for (const act of data) {
    if (!act.started_at) continue
    const localDate = getLocalDateString(act.started_at)
    if (!localDate.startsWith(String(year))) continue

    if (!historyMap[localDate]) {
      historyMap[localDate] = {
        date: localDate,
        total_duration_seconds: 0,
        activity_count: 0,
      }
    }

    historyMap[localDate].total_duration_seconds += act.duration_seconds || 0
    historyMap[localDate].activity_count += 1
  }

  return historyMap
}

/**
 * Compute summary statistics for the logged-in user for a given calendar year.
 */
export async function getYearActivitySummary(year: number): Promise<YearActivitySummary> {
  const historyMap = await getActivityHistory(year)

  let totalDuration = 0
  let totalActivities = 0
  let activeDays = 0
  let longestDay: { date: string; total_duration_seconds: number; activity_count: number } | null = null

  for (const dateStr of Object.keys(historyMap)) {
    const dayData = historyMap[dateStr]
    if (dayData.activity_count > 0 && dayData.total_duration_seconds > 0) {
      activeDays += 1
      totalDuration += dayData.total_duration_seconds
      totalActivities += dayData.activity_count

      if (!longestDay || dayData.total_duration_seconds > longestDay.total_duration_seconds) {
        longestDay = {
          date: dayData.date,
          total_duration_seconds: dayData.total_duration_seconds,
          activity_count: dayData.activity_count,
        }
      }
    }
  }

  return {
    year,
    total_duration_seconds: totalDuration,
    active_days: activeDays,
    activity_count: totalActivities,
    longest_day: longestDay,
  }
}

/**
 * Fetch all activities starting on a specific local calendar date (YYYY-MM-DD) for the logged-in user.
 */
export async function getActivitiesForDate(dateStr: string): Promise<Activity[]> {
  const supabase = await createClient()
  if (!supabase || !dateStr) return []

  const targetDate = new Date(dateStr)
  if (isNaN(targetDate.getTime())) return []

  const startBound = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const endBound = new Date(targetDate.getTime() + 48 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('activities')
    .select('*, subject:subjects(*)')
    .gte('started_at', startBound)
    .lte('started_at', endBound)
    .order('started_at', { ascending: false })

  if (error || !data) {
    if (error) console.error('Error fetching activities for date:', error)
    return []
  }

  const matching = (data as Activity[]).filter((act) => getLocalDateString(act.started_at) === dateStr)
  return matching
}
