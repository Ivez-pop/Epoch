'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createActivity } from '@/lib/activities'
import { getSubjects } from '@/lib/subjects'
import { Activity, Subject } from '@/lib/supabase'
import { formatDuration } from '@/lib/utils'
import { CreateSubjectModal } from './CreateSubjectModal'

interface SaveActivityFormProps {
  activityData: {
    started_at: string
    ended_at: string
    duration_seconds: number
  }
  onDiscard?: () => void
}

export function SaveActivityForm({ activityData, onDiscard }: SaveActivityFormProps) {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Fetch available subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        const subs = await getSubjects()
        let combined = [...subs]

        // Local fallback check
        try {
          const stored = localStorage.getItem('epoch_local_subjects')
          if (stored) {
            const localSubs: Subject[] = JSON.parse(stored)
            for (const item of localSubs) {
              if (!combined.some((s) => s.id === item.id)) {
                combined.push({ ...item, total_duration_seconds: 0, activity_count: 0 })
              }
            }
          }
        } catch {
          // ignore
        }

        setSubjects(combined)
      } catch (err) {
        console.error('Error loading subjects:', err)
      }
    }
    loadSubjects()
  }, [])

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === '__CREATE_NEW__') {
      setIsCreateModalOpen(true)
    } else {
      setSelectedSubjectId(val)
      setValidationError(null)
    }
  }

  const handleSubjectCreated = (newSubject: Subject) => {
    setSubjects((prev) => [newSubject, ...prev])
    setSelectedSubjectId(newSubject.id)
    setValidationError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSubjectId) {
      setValidationError('Please select a subject.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const payload = {
      started_at: activityData.started_at,
      ended_at: activityData.ended_at,
      duration_seconds: activityData.duration_seconds,
      title: title.trim() || null,
      description: description.trim() || null,
      subject_id: selectedSubjectId,
    }

    try {
      const res = await createActivity(payload)

      // Store in local fallback if Supabase is not configured yet
      if (!res.success) {
        const selectedSubObj = subjects.find((s) => s.id === selectedSubjectId)
        const localActivity: Activity = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          started_at: payload.started_at,
          ended_at: payload.ended_at,
          duration_seconds: payload.duration_seconds,
          title: payload.title,
          description: payload.description,
          subject_id: selectedSubjectId,
          subject: selectedSubObj || null,
          created_at: new Date().toISOString(),
        }

        try {
          const stored = localStorage.getItem('epoch_local_activities')
          const existing: Activity[] = stored ? JSON.parse(stored) : []
          existing.unshift(localActivity)
          localStorage.setItem('epoch_local_activities', JSON.stringify(existing))
        } catch {
          // ignore
        }
      }

      // Return to Activity Feed
      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error('Failed to save activity:', err)
      setErrorMessage(err.message || 'An unexpected error occurred while saving.')
      setIsSubmitting(false)
    }
  }

  const handleDiscard = () => {
    if (activityData.duration_seconds > 5) {
      const confirmed = window.confirm(
        'Are you sure you want to discard this activity? It will not be saved.'
      )
      if (!confirmed) return
    }

    if (onDiscard) {
      onDiscard()
    } else {
      router.push('/')
    }
  }

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  return (
    <>
      <div className="w-full max-w-lg mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100">Save Activity</h2>
            <p className="text-xs text-zinc-400 mt-1">Review details before saving to your feed</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 block">Duration</span>
            <span className="text-lg font-mono font-bold text-orange-400">{formatDuration(activityData.duration_seconds)}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Subject Field (Required) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="subject" className="block text-sm font-medium text-zinc-200">
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

            <div className="relative">
              <select
                id="subject"
                value={selectedSubjectId}
                onChange={handleSelectChange}
                className={`w-full appearance-none rounded-xl border ${
                  validationError ? 'border-red-500/80 bg-red-950/20' : 'border-zinc-800 bg-zinc-950'
                } px-4 py-3 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors pr-10`}
              >
                <option value="" disabled>
                  Select subject ▼
                </option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id} className="bg-zinc-900 text-zinc-100">
                    {sub.name}
                  </option>
                ))}
                <option value="__CREATE_NEW__" className="bg-zinc-900 text-orange-400 font-medium">
                  + Create new subject
                </option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {selectedSubject && (
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedSubject.color || '#f97316' }}
                />
                <span>Selected: <strong className="text-zinc-200">{selectedSubject.name}</strong></span>
              </div>
            )}

            {validationError && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">{validationError}</p>
            )}
          </div>

          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-200 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Consumer Rebalancing"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
            />
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-200 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between gap-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Discard
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Activity'
              )}
            </button>
          </div>
        </form>
      </div>

      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSubjectCreated}
      />
    </>
  )
}
