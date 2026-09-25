'use client'

import React, { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Activity, Subject } from '@/lib/supabase'
import { ActivityCard } from './ActivityCard'
import { searchActivities } from '@/lib/activities'

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
  subjects: Subject[]
  currentFilters: CurrentFilters
}

export function ActivityFeed({
  initialActivities,
  initialNextCursor,
  initialHasMore,
  initialTotalCount = 0,
  subjects,
  currentFilters,
}: ActivityFeedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore)
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

  // Local state for search text input so user can type smoothly before committing
  const [searchInput, setSearchInput] = useState<string>(currentFilters.q)

  // Sync props to state when server revalidates or searchParams change
  useEffect(() => {
    setActivities(initialActivities)
    setNextCursor(initialNextCursor)
    setHasMore(initialHasMore)
    setTotalCount(initialTotalCount)
    setSearchInput(currentFilters.q)
  }, [initialActivities, initialNextCursor, initialHasMore, initialTotalCount, currentFilters.q])

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

  // Selected subject object
  const activeSubject = subjects.find((s) => s.id === currentFilters.subject)

  // Format date range text for pill
  const formatDateRangePill = () => {
    const { from, to } = currentFilters
    if (from && to) {
      return `${from} → ${to}`
    } else if (from) {
      return `From ${from}`
    } else if (to) {
      return `Until ${to}`
    }
    return ''
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="flex items-center justify-between pb-5 mb-5 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-pulse" />
            Epoch
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Personal Activity Tracker</p>
        </div>

        <Link
          href="/activity/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Start Activity
        </Link>
      </header>

      {/* Filter Controls Bar */}
      <div className="space-y-3 mb-6 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search activities by title or description..."
            className="w-full pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                updateUrlFilters({ q: '' })
              }}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-zinc-300"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters Row: Subject + Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Subject Dropdown */}
          <div className="sm:col-span-1">
            <label htmlFor="subject_filter" className="sr-only">Filter by Subject</label>
            <select
              id="subject_filter"
              value={currentFilters.subject}
              onChange={(e) => updateUrlFilters({ subject: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="%23a1a1aa" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
            >
              <option value="">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label htmlFor="from_date_filter" className="sr-only">From Date</label>
            <div className="relative">
              <input
                id="from_date_filter"
                type="date"
                value={currentFilters.from}
                onChange={(e) => updateUrlFilters({ from: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="From"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="to_date_filter" className="sr-only">To Date</label>
            <div className="relative">
              <input
                id="to_date_filter"
                type="date"
                value={currentFilters.to}
                onChange={(e) => updateUrlFilters({ to: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="To"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Indicators & Results Count */}
      {hasActiveFilters ? (
        <div className="mb-6 bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-zinc-300">
              {totalCount} {totalCount === 1 ? 'activity' : 'activities'} found
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
            >
              Clear filters
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {currentFilters.q.trim() && (
              <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-700">
                Search: &quot;{currentFilters.q.trim()}&quot;
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    updateUrlFilters({ q: '' })
                  }}
                  className="text-zinc-400 hover:text-zinc-100 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}

            {activeSubject && (
              <span className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-700">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: activeSubject.color || '#f97316' }}
                />
                {activeSubject.name}
                <button
                  type="button"
                  onClick={() => updateUrlFilters({ subject: '' })}
                  className="text-zinc-400 hover:text-zinc-100 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}

            {(currentFilters.from || currentFilters.to) && (
              <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-700">
                {formatDateRangePill()}
                <button
                  type="button"
                  onClick={() => updateUrlFilters({ from: '', to: '' })}
                  className="text-zinc-400 hover:text-zinc-100 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-3 mb-4">
          <h2 className="text-sm font-semibold text-zinc-200">Recent Activity</h2>
        </div>
      )}

      {/* Feed list or empty state */}
      {activities.length === 0 ? (
        hasActiveFilters ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-zinc-200">No matching activities.</h2>
            <p className="text-sm text-zinc-400 mt-1 mb-6">
              Try changing your search or filters.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-orange-500 transition-colors shadow-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-zinc-200">No activity yet.</h2>
            <p className="text-sm text-zinc-400 mt-1 mb-6">
              Start your first activity and begin building your Epoch history.
            </p>
            <Link
              href="/activity/new"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-orange-500 transition-colors shadow-sm"
            >
              Start Activity
            </Link>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {hasMore && (
            <div className="pt-6 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {isLoadingMore ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
