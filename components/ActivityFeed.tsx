'use client'

import React, { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, SubjectWithTime, Subject } from '@/lib/supabase'
import { ProfileStats } from '@/lib/profile'
import { DailyActivitySummary } from '@/lib/history'
import { ActivityCard } from './ActivityCard'
import { ContributionHeatmap } from './ContributionHeatmap'
import { CreateSubjectModal } from './CreateSubjectModal'
import { searchActivities } from '@/lib/activities'
import { formatDuration } from '@/lib/utils'

interface CurrentFilters {
  q: string
  subject: string
  from: string
  to: string
}

interface ActivityFeedProps {
  initialActivities: Activity[]
  initialNextCursor: string | null
  initialHasMore: boolean
  initialTotalCount?: number
  subjects: SubjectWithTime[]
  stats?: ProfileStats
  historyMap?: Record<string, DailyActivitySummary>
  currentYear?: number
  currentFilters: CurrentFilters
}

export function ActivityFeed({
  initialActivities,
  initialNextCursor,
  initialHasMore,
  initialTotalCount = 0,
  subjects: initialSubjects,
  stats,
  historyMap = {},
  currentYear = new Date().getFullYear(),
  currentFilters,
}: ActivityFeedProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore)
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [subjects, setSubjects] = useState<SubjectWithTime[]>(initialSubjects)
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false)

  // Local state for search text input
  const [searchInput, setSearchInput] = useState<string>(currentFilters.q)

  // Sync props to state when server revalidates or filters change
  useEffect(() => {
    setActivities(initialActivities)
    setNextCursor(initialNextCursor)
    setHasMore(initialHasMore)
    setTotalCount(initialTotalCount)
    setSearchInput(currentFilters.q)
    setSubjects(initialSubjects)
  }, [initialActivities, initialNextCursor, initialHasMore, initialTotalCount, initialSubjects, currentFilters.q])

  const hasActiveFilters = Boolean(
    currentFilters.q.trim() || currentFilters.subject || currentFilters.from || currentFilters.to
  )

  // Update URL parameters
  const updateUrlFilters = (newFilters: Partial<CurrentFilters>) => {
    const updated = { ...currentFilters, ...newFilters }
    const params = new URLSearchParams()

    if (updated.q && updated.q.trim()) params.set('q', updated.q.trim())
    if (updated.subject && updated.subject.trim()) params.set('subject', updated.subject.trim())
    if (updated.from && updated.from.trim()) params.set('from', updated.from.trim())
    if (updated.to && updated.to.trim()) params.set('to', updated.to.trim())

    const queryStr = params.toString()
    const targetUrl = queryStr ? `/?${queryStr}` : '/'
    startTransition(() => {
      router.push(targetUrl)
    })
  }

  // Handle live search input change (debounced URL update)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== currentFilters.q.trim()) {
        updateUrlFilters({ q: searchInput })
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Keyboard shortcut listener ('N' for add subject)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setIsAddSubjectOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleClearFilters = () => {
    setSearchInput('')
    startTransition(() => {
      router.push('/')
    })
  }

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const res = await searchActivities({
        query: currentFilters.q,
        subjectId: currentFilters.subject,
        from: currentFilters.from,
        to: currentFilters.to,
        cursor: nextCursor,
        limit: 20,
      })

      if (res.activities.length > 0) {
        setActivities((prev) => {
          const combined = [...prev]
          for (const item of res.activities) {
            if (!combined.some((a) => a.id === item.id)) {
              combined.push(item)
            }
          }
          return combined
        })
        setNextCursor(res.nextCursor)
        setHasMore(res.hasMore)
      } else {
        setHasMore(false)
        setNextCursor(null)
      }
    } catch (err) {
      console.error('Error loading more activities:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Quick Granularity Filter Preset handler
  const setGranularityPreset = (preset: 'all' | '365d' | '90d' | 'month') => {
    const now = new Date()
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    if (preset === 'all') {
      updateUrlFilters({ from: '', to: '' })
    } else if (preset === '365d') {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 365)
      updateUrlFilters({ from: formatDate(d), to: '' })
    } else if (preset === '90d') {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
      updateUrlFilters({ from: formatDate(d), to: '' })
    } else if (preset === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      updateUrlFilters({ from: formatDate(d), to: '' })
    }
  }

  const activeSubject = subjects.find((s) => s.id === currentFilters.subject)
  const totalLoggedSeconds = stats?.total_duration_seconds || 0

  // Calculate subject rankings with percentage of total duration
  const rankedSubjects = subjects
    .filter((s) => s.total_duration_seconds > 0)
    .sort((a, b) => b.total_duration_seconds - a.total_duration_seconds)
    .slice(0, 5)

  const handleSubjectCreated = (newSubject: Subject) => {
    const newSubWithTime: SubjectWithTime = {
      ...newSubject,
      total_duration_seconds: 0,
      activity_count: 0,
    }
    setSubjects((prev) => [...prev, newSubWithTime])
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
      {/* KPI Metric Summary Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-github-subtle/60 p-3 rounded-xl border border-github-border">
        <div className="p-3 border-r border-github-border/50">
          <p className="text-xs uppercase font-mono tracking-wider text-github-muted">Total Time Logged</p>
          <p className="text-2xl font-black font-mono text-github-bright mt-1">
            {formatDuration(stats?.total_duration_seconds)}
          </p>
        </div>

        <div className="p-3 border-r border-github-border/50">
          <p className="text-xs uppercase font-mono tracking-wider text-github-muted">Daily Average (30d)</p>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {formatDuration(stats?.daily_average_30d_seconds)}
          </p>
        </div>

        <div className="p-3 border-r border-github-border/50">
          <p className="text-xs uppercase font-mono tracking-wider text-github-muted">Consistency Rate</p>
          <p className="text-2xl font-black font-mono text-github-bright mt-1">
            {stats?.consistency_rate_30d ?? 0}<span className="text-sm text-github-muted">%</span>
          </p>
        </div>

        <div className="p-3">
          <p className="text-xs uppercase font-mono tracking-wider text-github-muted">Weekly Focus</p>
          <p className="text-2xl font-black font-mono text-strava mt-1">
            {formatDuration(stats?.weekly_focus_seconds)}
          </p>
        </div>
      </section>

      {/* Main 2-Column Core Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Filter Bar + GitHub Heatmap + Ranked Subjects + Feed */}
        <section className="lg:col-span-8 space-y-6">
          {/* Top Search & Filter Bar */}
          <div className="bg-github-subtle border border-github-border rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Filter telemetry, tags, subjects..."
                className="w-full bg-[#0d1117] border border-github-border rounded-lg pl-9 pr-8 py-1.5 text-sm text-github-bright placeholder-github-muted focus:border-strava focus:ring-1 focus:ring-strava"
              />
              <svg className="w-4 h-4 text-github-muted absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    updateUrlFilters({ q: '' })
                  }}
                  className="absolute right-2.5 top-2 text-github-muted hover:text-github-bright"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Quick Granularity Filter Chips */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setGranularityPreset('all')}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition ${
                  !currentFilters.from ? 'bg-strava text-white shadow-sm' : 'bg-github-canvas text-github-muted hover:text-github-bright border border-github-border'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setGranularityPreset('365d')}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-github-canvas text-github-muted hover:text-github-bright border border-github-border transition"
              >
                Past 365D
              </button>
              <button
                type="button"
                onClick={() => setGranularityPreset('90d')}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-github-canvas text-github-muted hover:text-github-bright border border-github-border transition"
              >
                Past 90D
              </button>
              <button
                type="button"
                onClick={() => setGranularityPreset('month')}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-github-canvas text-github-muted hover:text-github-bright border border-github-border transition"
              >
                Month
              </button>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="bg-github-subtle border border-github-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-github-muted">{totalCount} telemetry records match</span>
                {currentFilters.q && (
                  <span className="bg-github-canvas border border-github-border px-2 py-0.5 rounded text-github-bright flex items-center gap-1">
                    Search: &quot;{currentFilters.q}&quot;
                    <button type="button" onClick={() => updateUrlFilters({ q: '' })}>
                      &times;
                    </button>
                  </span>
                )}
                {activeSubject && (
                  <span className="bg-github-canvas border border-github-border px-2 py-0.5 rounded text-github-bright flex items-center gap-1">
                    Subject: {activeSubject.name}
                    <button type="button" onClick={() => updateUrlFilters({ subject: '' })}>
                      &times;
                    </button>
                  </span>
                )}
                {(currentFilters.from || currentFilters.to) && (
                  <span className="bg-github-canvas border border-github-border px-2 py-0.5 rounded text-github-bright flex items-center gap-1">
                    Date: {currentFilters.from || '…'} → {currentFilters.to || '…'}
                    <button type="button" onClick={() => updateUrlFilters({ from: '', to: '' })}>
                      &times;
                    </button>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-strava font-bold hover:underline"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Contribution Heatmap Matrix Viewport */}
          <div className="bg-github-subtle border border-github-border rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-github-border/60 gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-github-bright flex items-center gap-2">
                  <span>Github Contribution Matrix</span>
                  <span className="text-xs font-mono bg-strava-light text-strava px-2 py-0.5 rounded font-semibold border border-strava/20">
                    Year {currentYear}
                  </span>
                </h2>
                <p className="text-xs text-github-muted mt-0.5">Telemetry log of continuous deliberate focus hours</p>
              </div>
            </div>

            <ContributionHeatmap
              year={currentYear}
              historyMap={historyMap}
              selectedDate={currentFilters.from && currentFilters.from === currentFilters.to ? currentFilters.from : null}
              onSelectDate={(dStr) => updateUrlFilters({ from: dStr, to: dStr })}
            />
          </div>

          {/* Ranking of Subjects (Based on Total Hours Spent) */}
          <div className="bg-github-subtle border border-github-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-github-bright flex items-center gap-2">
                  <span>Ranking of Subjects</span>
                  <span className="text-xs font-mono text-github-muted font-normal">(Based on Hours Spent)</span>
                </h2>
              </div>
              <div className="text-xs font-mono text-github-muted bg-github-canvas px-2.5 py-1 rounded border border-github-border">
                Segment: <span className="text-strava font-bold">All-Time PR</span>
              </div>
            </div>

            {rankedSubjects.length === 0 ? (
              <p className="text-xs text-github-muted py-4 text-center font-mono">
                No telemetry time logged for subjects yet.
              </p>
            ) : (
              <div className="space-y-3 font-mono">
                {rankedSubjects.map((sub, idx) => {
                  const rankStr = String(idx + 1).padStart(2, '0')
                  const percent = totalLoggedSeconds > 0 ? ((sub.total_duration_seconds / totalLoggedSeconds) * 100).toFixed(1) : '0.0'
                  const color = sub.color || '#FC5200'

                  return (
                    <div
                      key={sub.id}
                      onClick={() => updateUrlFilters({ subject: sub.id })}
                      className="p-3.5 rounded-lg bg-github-canvas border border-github-border/80 hover:border-strava/50 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-strava font-black text-base w-6 text-center">{rankStr}</span>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-sans font-bold text-github-bright">{sub.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-github-muted font-sans hidden sm:inline">
                            {sub.activity_count} {sub.activity_count === 1 ? 'session' : 'sessions'}
                          </span>
                          <span className="font-bold text-github-bright text-base">
                            {formatDuration(sub.total_duration_seconds)}
                          </span>
                          <span className="text-strava font-bold text-xs bg-strava/10 px-2 py-0.5 rounded">
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-[#1c2128] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-600 to-strava h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(2, parseFloat(percent)))}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Strava Activity Stream Feed */}
          <div className="bg-github-subtle border border-github-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-github-border/60">
              <h3 className="text-sm font-bold text-github-bright uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-strava fill-current" viewBox="0 0 24 24">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.227 14.172h4.172" />
                </svg>
                Recent Telemetry Logs
              </h3>
              <span className="text-xs font-mono text-github-muted">Sync: Live</span>
            </div>

            {activities.length === 0 ? (
              <div className="p-8 text-center bg-github-canvas rounded-lg border border-dashed border-github-border">
                <p className="text-sm text-github-muted">No telemetry records found.</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-mono text-strava font-bold hover:underline"
                  >
                    Clear active filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}

                {hasMore && (
                  <div className="pt-4 text-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="w-full py-2.5 px-4 rounded-lg bg-github-canvas hover:bg-github-subtle text-github-muted hover:text-github-bright border border-github-border font-mono text-xs font-bold transition disabled:opacity-50"
                    >
                      {isLoadingMore ? 'Loading telemetry...' : 'Load More Records'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Subjects Side Panel */}
        <aside className="lg:col-span-4 sticky top-20">
          <div className="bg-github-subtle border border-github-border rounded-xl p-5 flex flex-col max-h-[calc(100vh-6.5rem)] shadow-lg">
            {/* Subjects Header */}
            <div className="flex items-center justify-between pb-4 border-b border-github-border">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-github-bright tracking-tight">Subjects</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-strava-light text-strava border border-strava/30">
                  {subjects.length} Active
                </span>
              </div>
              <Link
                href="/subjects"
                className="text-github-muted hover:text-github-bright p-1 rounded hover:bg-github-canvas transition"
                title="View all subjects"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </Link>
            </div>

            {/* Scrollable Subjects List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 min-h-0">
              {subjects.length === 0 ? (
                <p className="text-xs text-github-muted py-4 text-center font-mono">
                  No subjects created yet.
                </p>
              ) : (
                subjects.map((sub) => {
                  const color = sub.color || '#FC5200'
                  const isSelected = currentFilters.subject === sub.id

                  return (
                    <div
                      key={sub.id}
                      onClick={() => updateUrlFilters({ subject: isSelected ? '' : sub.id })}
                      className={`group p-3 rounded-lg bg-github-canvas border transition cursor-pointer ${
                        isSelected
                          ? 'border-strava bg-strava-light/20 shadow-md'
                          : 'border-github-border hover:border-strava/70 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full mt-1.5 ring-2 shrink-0"
                            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
                          />
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-github-bright group-hover:text-strava transition truncate">
                              {sub.name}
                            </h3>
                            <p className="text-xs text-github-muted font-mono mt-0.5 truncate">
                              {sub.activity_count} sessions • {formatDuration(sub.total_duration_seconds)} total
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/30 px-1.5 py-0.5 rounded shrink-0 ml-2">
                          {sub.activity_count > 0 ? 'Active' : 'Idle'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Bottom "+" Add Subject Button */}
            <div className="pt-3 border-t border-github-border">
              <button
                type="button"
                onClick={() => setIsAddSubjectOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-github-canvas hover:bg-strava-light text-github-muted hover:text-strava border border-github-border hover:border-strava/50 font-mono text-xs font-bold transition"
              >
                <svg className="w-4 h-4 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Add New Subject</span>
                <kbd className="text-[10px] bg-[#161b22] px-1.5 py-0.5 rounded border border-github-border text-github-muted">N</kbd>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <CreateSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        onSuccess={handleSubjectCreated}
      />
    </div>
  )
}

