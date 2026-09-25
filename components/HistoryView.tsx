'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DailyActivitySummary, YearActivitySummary } from '@/lib/history'
import { getActivityHistory, getYearActivitySummary, getActivitiesForDate } from '@/lib/history'
import { Activity } from '@/lib/supabase'
import { formatDuration, formatFullDate } from '@/lib/utils'
import { ContributionHeatmap } from './ContributionHeatmap'
import { ActivityCard } from './ActivityCard'

interface HistoryViewProps {
  initialYear: number
  initialHistoryMap: Record<string, DailyActivitySummary>
  initialSummary: YearActivitySummary
  initialDateActivities: Activity[]
  initialSelectedDate: string | null
}

export function HistoryView({
  initialYear,
  initialHistoryMap,
  initialSummary,
  initialDateActivities,
  initialSelectedDate,
}: HistoryViewProps) {
  const [year, setYear] = useState<number>(initialYear)
  const [historyMap, setHistoryMap] = useState<Record<string, DailyActivitySummary>>(initialHistoryMap)
  const [summary, setSummary] = useState<YearActivitySummary>(initialSummary)
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSelectedDate)
  const [dateActivities, setDateActivities] = useState<Activity[]>(initialDateActivities)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Load year data when year changes
  useEffect(() => {
    async function loadYearData() {
      setIsLoading(true)
      try {
        const map = await getActivityHistory(year)
        const sum = await getYearActivitySummary(year)
        let mergedMap = { ...map }

        // Local fallback check
        try {
          const stored = localStorage.getItem('epoch_local_activities')
          if (stored) {
            const localActs: Activity[] = JSON.parse(stored)
            for (const act of localActs) {
              if (!act.started_at) continue
              const d = new Date(act.started_at)
              if (d.getFullYear() === year) {
                const yearNum = d.getFullYear()
                const monthStr = String(d.getMonth() + 1).padStart(2, '0')
                const dayStr = String(d.getDate()).padStart(2, '0')
                const dateKey = `${yearNum}-${monthStr}-${dayStr}`

                if (!mergedMap[dateKey]) {
                  mergedMap[dateKey] = {
                    date: dateKey,
                    total_duration_seconds: 0,
                    activity_count: 0,
                  }
                }
                mergedMap[dateKey].total_duration_seconds += act.duration_seconds || 0
                mergedMap[dateKey].activity_count += 1
              }
            }
          }
        } catch {
          // ignore
        }

        // Compute summary from merged map
        let totalSecs = 0
        let totalActs = 0
        let activeDaysCount = 0
        let maxDay: { date: string; total_duration_seconds: number; activity_count: number } | null = null

        Object.keys(mergedMap).forEach((dateKey) => {
          const item = mergedMap[dateKey]
          if (item.activity_count > 0 && item.total_duration_seconds > 0) {
            activeDaysCount += 1
            totalSecs += item.total_duration_seconds
            totalActs += item.activity_count

            if (!maxDay || item.total_duration_seconds > maxDay.total_duration_seconds) {
              maxDay = { ...item }
            }
          }
        })

        const computedSummary: YearActivitySummary = {
          year,
          total_duration_seconds: totalSecs,
          active_days: activeDaysCount,
          activity_count: totalActs,
          longest_day: maxDay,
        }

        setHistoryMap(mergedMap)
        setSummary(computedSummary)

        // Select latest active day in year if current selection is not in year
        const datesInYear = Object.keys(mergedMap).filter(
          (k) => mergedMap[k].activity_count > 0
        )
        datesInYear.sort()
        const latestDate = datesInYear.length > 0 ? datesInYear[datesInYear.length - 1] : null
        setSelectedDate(latestDate)
      } catch (err) {
        console.error('Error loading history year data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadYearData()
  }, [year])

  // Load activities for selected date
  useEffect(() => {
    async function loadDateActivities() {
      if (!selectedDate) {
        setDateActivities([])
        return
      }

      try {
        const acts = await getActivitiesForDate(selectedDate)
        let combined = [...acts]

        try {
          const stored = localStorage.getItem('epoch_local_activities')
          if (stored) {
            const localActs: Activity[] = JSON.parse(stored)
            const matchedLocal = localActs.filter((a) => {
              if (!a.started_at) return false
              const d = new Date(a.started_at)
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              return `${y}-${m}-${day}` === selectedDate
            })

            for (const item of matchedLocal) {
              if (!combined.some((c) => c.id === item.id)) {
                combined.push(item)
              }
            }
          }
        } catch {
          // ignore
        }

        combined.sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )
        setDateActivities(combined)
      } catch (err) {
        console.error('Error loading date activities:', err)
      }
    }

    loadDateActivities()
  }, [selectedDate])

  const selectedDaySummary = selectedDate ? historyMap[selectedDate] : null

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Header & Year Controls */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Activity History</h1>
          <p className="text-xs text-zinc-400 mt-1">Consistency & annual activity timeline</p>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-1">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Previous Year"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-mono text-sm font-bold text-zinc-100 px-2">{year}</span>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Next Year"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-500 block mb-1">Total Activity</span>
          <span className="font-mono text-lg font-bold text-orange-400">
            {formatDuration(summary.total_duration_seconds)}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-500 block mb-1">Active Days</span>
          <span className="font-mono text-lg font-bold text-zinc-100">
            {summary.active_days}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-500 block mb-1">Activities</span>
          <span className="font-mono text-lg font-bold text-zinc-100">
            {summary.activity_count}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-500 block mb-1">Longest Day</span>
          {summary.longest_day ? (
            <div>
              <span className="font-mono text-sm font-bold text-orange-400 block">
                {formatDuration(summary.longest_day.total_duration_seconds)}
              </span>
              <span className="text-[10px] text-zinc-500 block truncate">
                {formatFullDate(summary.longest_day.date)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-zinc-500">—</span>
          )}
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="mb-8">
        <ContributionHeatmap
          year={year}
          historyMap={historyMap}
          selectedDate={selectedDate}
          onSelectDate={(dStr) => setSelectedDate(dStr)}
        />
      </div>

      {/* Selected Day Activities or Empty Year State */}
      {summary.activity_count === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
          <h2 className="text-base font-semibold text-zinc-200">No activity recorded in {year}.</h2>
          <p className="text-sm text-zinc-400 mt-1 mb-6">
            Start an activity to begin building your history.
          </p>
          <Link
            href="/activity/new"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-orange-500 transition-colors shadow-sm"
          >
            Start Activity
          </Link>
        </div>
      ) : selectedDate ? (
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {formatFullDate(selectedDate)}
              </h2>
              <span className="text-xs text-zinc-400">
                {selectedDaySummary
                  ? `${formatDuration(selectedDaySummary.total_duration_seconds)} · ${
                      selectedDaySummary.activity_count
                    } ${selectedDaySummary.activity_count === 1 ? 'activity' : 'activities'}`
                  : 'No activities'}
              </span>
            </div>

            <Link
              href={`/?from=${selectedDate}&to=${selectedDate}`}
              className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 shrink-0"
            >
              View in feed &rarr;
            </Link>
          </div>

          {dateActivities.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              No activities recorded on this date.
            </div>
          ) : (
            <div className="space-y-3">
              {dateActivities.map((act) => (
                <ActivityCard key={act.id} activity={act} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
