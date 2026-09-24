'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity } from '@/lib/supabase'
import { ActivityCard } from './ActivityCard'

interface ActivityFeedProps {
  initialActivities: Activity[]
}

export function ActivityFeed({ initialActivities }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)

  useEffect(() => {
    // Check if there are local fallback activities in localStorage (for offline/demo state when Supabase isn't configured)
    try {
      const stored = localStorage.getItem('epoch_local_activities')
      if (stored) {
        const localItems: Activity[] = JSON.parse(stored)
        // Combine server and local activities, removing duplicates by id
        const combined = [...initialActivities]
        for (const item of localItems) {
          if (!combined.some((a) => a.id === item.id)) {
            combined.push(item)
          }
        }
        // Sort newest first by started_at
        combined.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        setActivities(combined)
      } else {
        setActivities(initialActivities)
      }
    } catch {
      setActivities(initialActivities)
    }
  }, [initialActivities])

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Header & Main Action */}
      <header className="flex items-center justify-between pb-8 mb-8 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-pulse" />
            Epoch
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Personal Activity Tracker</p>
        </div>

        <Link
          href="/activity/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 transition-colors"
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
          <h2 className="text-base font-semibold text-zinc-200">No activities yet.</h2>
          <p className="text-sm text-zinc-400 mt-1 mb-6">Start your first activity to begin tracking.</p>
          <Link
            href="/activity/new"
            className="inline-flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
          >
            Start an activity now &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  )
}
