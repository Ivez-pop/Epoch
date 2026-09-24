'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { SubjectWithTime, Activity, Subject } from '@/lib/supabase'
import { formatDuration } from '@/lib/utils'
import { ActivityCard } from '@/components/ActivityCard'

interface SubjectDetailViewProps {
  initialSubject: SubjectWithTime
  initialActivities: Activity[]
}

export function SubjectDetailView({ initialSubject, initialActivities }: SubjectDetailViewProps) {
  const [subject, setSubject] = useState<SubjectWithTime>(initialSubject)
  const [activities, setActivities] = useState<Activity[]>(initialActivities)

  useEffect(() => {
    // Check local fallback sync if Supabase is offline
    try {
      const storedSubjects = localStorage.getItem('epoch_local_subjects')
      let currentSub = { ...initialSubject }
      if (storedSubjects) {
        const localSubs: Subject[] = JSON.parse(storedSubjects)
        const matched = localSubs.find((s) => s.id === initialSubject.id)
        if (matched) {
          currentSub = { ...currentSub, ...matched }
        }
      }

      const storedActs = localStorage.getItem('epoch_local_activities')
      if (storedActs) {
        const localActs: Activity[] = JSON.parse(storedActs)
        const matchingLocalActs = localActs.filter((a) => a.subject_id === initialSubject.id)

        const combined = [...initialActivities]
        for (const item of matchingLocalActs) {
          if (!combined.some((a) => a.id === item.id)) {
            combined.push(item)
          }
        }

        combined.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

        const totalSecs = combined.reduce((sum, a) => sum + (a.duration_seconds || 0), 0)

        setActivities(combined)
        setSubject({
          ...currentSub,
          total_duration_seconds: totalSecs,
          activity_count: combined.length,
        })
      } else {
        setSubject(currentSub)
        setActivities(initialActivities)
      }
    } catch {
      setSubject(initialSubject)
      setActivities(initialActivities)
    }
  }, [initialSubject, initialActivities])

  const formattedTotalTime = formatDuration(subject.total_duration_seconds)
  const color = subject.color || '#f97316'

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Back button & Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Subjects
        </Link>
      </div>

      {/* Header */}
      <div className="pb-6 mb-8 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: color }}
            />
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{subject.name}</h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-500 block">Total Time</span>
            <span className="font-mono text-xl font-bold text-orange-400">
              {formattedTotalTime}
            </span>
          </div>
        </div>
      </div>

      {/* Activities list for this subject */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Activity History ({activities.length})
        </h2>

        {activities.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
            <p className="text-sm text-zinc-400 mb-4">No activities logged under this subject yet.</p>
            <Link
              href="/activity/new"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition-colors"
            >
              Start Activity for {subject.name}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={{ ...activity, subject }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
