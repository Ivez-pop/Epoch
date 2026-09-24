'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, Subject } from '@/lib/supabase'
import { updateActivity, deleteActivity } from '@/lib/activities'
import { getSubjects } from '@/lib/subjects'
import { formatDuration, formatTimeRange, formatFullDate } from '@/lib/utils'
import { CreateSubjectModal } from './CreateSubjectModal'

interface ActivityDetailViewProps {
  initialActivity: Activity
}

export function ActivityDetailView({ initialActivity }: ActivityDetailViewProps) {
  const router = useRouter()
  const [activity, setActivity] = useState<Activity>(initialActivity)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')

  // Edit form state
  const [editSubjectId, setEditSubjectId] = useState<string>(initialActivity.subject_id || '')
  const [editTitle, setEditTitle] = useState<string>(initialActivity.title || '')
  const [editDescription, setEditDescription] = useState<string>(initialActivity.description || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Sync local fallback if Supabase is offline
  useEffect(() => {
    async function loadData() {
      try {
        const subs = await getSubjects()
        let combinedSubs = [...subs]

        try {
          const storedSubs = localStorage.getItem('epoch_local_subjects')
          if (storedSubs) {
            const localSubs: Subject[] = JSON.parse(storedSubs)
            for (const s of localSubs) {
              if (!combinedSubs.some((cs) => cs.id === s.id)) {
                combinedSubs.push({ ...s, total_duration_seconds: 0, activity_count: 0 })
              }
            }
          }
        } catch {
          // ignore
        }

        setSubjects(combinedSubs)

        // Check local activity override
        try {
          const storedActs = localStorage.getItem('epoch_local_activities')
          if (storedActs) {
            const localActs: Activity[] = JSON.parse(storedActs)
            const matched = localActs.find((a) => a.id === initialActivity.id)
            if (matched) {
              const matchedSub = combinedSubs.find((s) => s.id === matched.subject_id) || matched.subject
              const merged = { ...matched, subject: matchedSub || null }
              setActivity(merged)
              setEditSubjectId(merged.subject_id || '')
              setEditTitle(merged.title || '')
              setEditDescription(merged.description || '')
            }
          }
        } catch {
          // ignore
        }
      } catch (err) {
        console.error('Error initializing activity detail:', err)
      }
    }

    loadData()
  }, [initialActivity])

  const subject = activity.subject
  const subjectColor = subject?.color || '#f97316'
  const formattedDuration = formatDuration(activity.duration_seconds)
  const timeRange = formatTimeRange(activity.started_at, activity.ended_at)
  const fullDate = formatFullDate(activity.started_at)

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editSubjectId) {
      setError('Please select a subject.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const payload = {
      subject_id: editSubjectId,
      title: editTitle.trim() || null,
      description: editDescription.trim() || null,
    }

    try {
      const res = await updateActivity(activity.id, payload)

      if (res.success && res.data) {
        setActivity(res.data)
        setMode('view')
      } else {
        // Fallback update in localStorage if Supabase is offline
        const updatedSubject = subjects.find((s) => s.id === editSubjectId) || null
        const updatedLocalAct: Activity = {
          ...activity,
          subject_id: editSubjectId,
          subject: updatedSubject,
          title: payload.title,
          description: payload.description,
        }

        try {
          const stored = localStorage.getItem('epoch_local_activities')
          if (stored) {
            const localActs: Activity[] = JSON.parse(stored)
            const idx = localActs.findIndex((a) => a.id === activity.id)
            if (idx !== -1) {
              localActs[idx] = updatedLocalAct
            } else {
              localActs.unshift(updatedLocalAct)
            }
            localStorage.setItem('epoch_local_activities', JSON.stringify(localActs))
          }
        } catch {
          // ignore
        }

        setActivity(updatedLocalAct)
        setMode('view')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update activity.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await deleteActivity(activity.id)

      // Clear from localStorage fallback
      try {
        const stored = localStorage.getItem('epoch_local_activities')
        if (stored) {
          const localActs: Activity[] = JSON.parse(stored)
          const filtered = localActs.filter((a) => a.id !== activity.id)
          localStorage.setItem('epoch_local_activities', JSON.stringify(filtered))
        }
      } catch {
        // ignore
      }

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to delete activity.')
      setIsSubmitting(false)
    }
  }

  const handleSubjectCreated = (newSubject: Subject) => {
    setSubjects((prev) => [newSubject, ...prev])
    setEditSubjectId(newSubject.id)
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Activity Feed
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* VIEW MODE */}
      {mode === 'view' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 mb-4">
            {activity.title || <span className="italic text-zinc-500">Untitled Activity</span>}
          </h1>

          {/* Subject Badge */}
          {subject && (
            <div className="mb-6">
              <Link
                href={`/subjects/${subject.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/90 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: subjectColor }}
                />
                <span>{subject.name}</span>
              </Link>
            </div>
          )}

          {/* Duration Pill */}
          <div className="mb-6">
            <span className="font-mono text-4xl md:text-5xl font-extrabold text-orange-400 tracking-tight">
              {formattedDuration}
            </span>
          </div>

          {/* Timestamp Info */}
          <div className="py-4 border-y border-zinc-800/80 my-6 space-y-1 text-sm text-zinc-400">
            <div className="flex items-center gap-2 font-mono text-zinc-200">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{timeRange}</span>
            </div>
            <div className="text-xs text-zinc-500 pl-6">{fullDate}</div>
          </div>

          {/* Description */}
          {activity.description ? (
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Description
              </h3>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {activity.description}
              </p>
            </div>
          ) : (
            <div className="mb-8 text-xs text-zinc-500 italic">No description provided.</div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>

            <button
              type="button"
              onClick={() => setMode('delete')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {mode === 'edit' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-zinc-100 mb-6 pb-4 border-b border-zinc-800">
            Edit Activity
          </h2>

          <form onSubmit={handleSaveEdit} className="space-y-6">
            {/* Subject Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="edit-subject" className="block text-sm font-medium text-zinc-200">
                  Subject <span className="text-orange-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                >
                  + Create new subject
                </button>
              </div>

              <select
                id="edit-subject"
                value={editSubjectId}
                onChange={(e) => {
                  if (e.target.value === '__CREATE_NEW__') {
                    setIsCreateModalOpen(true)
                  } else {
                    setEditSubjectId(e.target.value)
                  }
                }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
              >
                <option value="" disabled>Select subject ▼</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-100">
                    {s.name}
                  </option>
                ))}
                <option value="__CREATE_NEW__" className="bg-zinc-900 text-orange-400 font-medium">
                  + Create new subject
                </option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-zinc-200 mb-2">
                Title
              </label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Consumer Rebalancing"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-zinc-200 mb-2">
                Description
              </label>
              <textarea
                id="edit-description"
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="What did you work on?"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
              />
            </div>

            {/* Read-Only Duration Notice */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300 block mb-1">Immutable Timing Data:</span>
              Recorded work time ({timeRange}, {formattedDuration}) cannot be modified.
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setMode('view')
                  setError(null)
                }}
                disabled={isSubmitting}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODE */}
      {mode === 'delete' && (
        <div className="rounded-2xl border border-red-900/50 bg-zinc-900 p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold text-zinc-100">Delete Activity?</h2>
          </div>

          <p className="text-sm text-zinc-300 mb-6">
            This will permanently remove:
          </p>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 mb-6">
            <div className="font-semibold text-zinc-100">
              {activity.title || 'Untitled Activity'}
            </div>
            <div className="text-xs font-mono text-orange-400 mt-1">
              {formattedDuration}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setMode('view')}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Activity'}
            </button>
          </div>
        </div>
      )}

      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSubjectCreated}
      />
    </div>
  )
}
