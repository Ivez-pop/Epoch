'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { SubjectWithTime, Subject } from '@/lib/supabase'
import { formatDuration } from '@/lib/utils'
import { CreateSubjectModal } from './CreateSubjectModal'

interface SubjectsFeedProps {
  initialSubjects: SubjectWithTime[]
}

export function SubjectsFeed({ initialSubjects }: SubjectsFeedProps) {
  const [subjects, setSubjects] = useState<SubjectWithTime[]>(initialSubjects)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    // Sync local fallback subjects if Supabase is offline
    try {
      const stored = localStorage.getItem('epoch_local_subjects')
      if (stored) {
        const localSubs: Subject[] = JSON.parse(stored)
        const localActivitiesStr = localStorage.getItem('epoch_local_activities')
        const localActivities = localActivitiesStr ? JSON.parse(localActivitiesStr) : []

        const timeMap: Record<string, { total: number; count: number }> = {}
        for (const act of localActivities) {
          if (act.subject_id && act.duration_seconds) {
            if (!timeMap[act.subject_id]) timeMap[act.subject_id] = { total: 0, count: 0 }
            timeMap[act.subject_id].total += act.duration_seconds
            timeMap[act.subject_id].count += 1
          }
        }

        const combined = [...initialSubjects]
        for (const item of localSubs) {
          if (!combined.some((s) => s.id === item.id)) {
            combined.push({
              ...item,
              total_duration_seconds: timeMap[item.id]?.total || 0,
              activity_count: timeMap[item.id]?.count || 0,
            })
          }
        }

        combined.sort((a, b) => b.total_duration_seconds - a.total_duration_seconds)
        setSubjects(combined)
      } else {
        setSubjects(initialSubjects)
      }
    } catch {
      setSubjects(initialSubjects)
    }
  }, [initialSubjects])

  const handleSubjectCreated = (newSubject: Subject) => {
    const newSubWithTime: SubjectWithTime = {
      ...newSubject,
      total_duration_seconds: 0,
      activity_count: 0,
    }
    setSubjects((prev) => [...prev, newSubWithTime])
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
          <div>
            <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-zinc-100">Subjects</h1>
            <p className="text-sm text-zinc-400 mt-2">Activity time breakdown by subject</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-800/90 border border-zinc-700/80 px-4 py-2.5 text-sm font-semibold text-zinc-100 shadow-sm hover:bg-zinc-700 transition-colors min-h-[42px]"
          >
            <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Subject
          </button>
        </div>

        {/* Subjects List */}
        {subjects.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
            <div className="w-14 h-14 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-200">No subjects created yet.</h2>
            <p className="text-sm text-zinc-400 mt-2 mb-6">Create subjects like Kafka, Systems, or AI to organize activities.</p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
            >
              + Create your first subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {subjects.map((subject) => {
              const formattedTotalTime = formatDuration(subject.total_duration_seconds)
              const color = subject.color || '#f97316'

              return (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.id}`}
                  className="group block rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5 sm:p-6 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/70 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-zinc-100 group-hover:text-orange-400 transition-colors">
                          {subject.name}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-sm sm:text-base font-bold text-orange-400">
                        {formattedTotalTime}
                      </span>
                      <span className="text-xs text-zinc-500 block mt-0.5">
                        {subject.activity_count} {subject.activity_count === 1 ? 'activity' : 'activities'}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Bottom Action Button */}
        {subjects.length > 0 && (
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-zinc-800 px-6 py-3.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 w-full justify-center transition-colors"
            >
              + New Subject
            </button>
          </div>
        )}

        <CreateSubjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleSubjectCreated}
        />
      </div>
    </div>
  )
}
