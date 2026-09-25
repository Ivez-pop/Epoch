'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity } from '@/lib/supabase'
import { ActivityCard } from './ActivityCard'
import { getRecentActivities } from '@/lib/activities'

interface ActivityFeedProps {
  initialActivities: Activity[]
  initialNextCursor: string | null
  initialHasMore: boolean
}

export function ActivityFeed({
  initialActivities,
  initialNextCursor,
  initialHasMore,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

  useEffect(() => {
    setActivities(initialActivities)
    setNextCursor(initialNextCursor)
    setHasMore(initialHasMore)
  }, [initialActivities, initialNextCursor, initialHasMore])

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const res = await getRecentActivities(20, nextCursor)
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

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Feed Header */}
      <header className="flex items-center justify-between pb-6 mb-8 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-pulse" />
            Epoch
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Recent Activity</p>
        </div>

        <Link
          href="/activity/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Start Activity
        </Link>
      </header>

      {/* Feed list or empty state */}
      {activities.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
