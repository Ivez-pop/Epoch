'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Profile, ProfileStats, updateProfile } from '@/lib/profile'
import { formatDuration } from '@/lib/utils'
import { signOut } from '@/lib/auth'

interface ProfileViewProps {
  profile: Profile | null
  userEmail: string
  createdAt: string
  displayName: string
  stats: ProfileStats
}

export function ProfileView({
  profile,
  userEmail,
  createdAt,
  displayName: initialDisplayName,
  stats,
}: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [isEditing, setIsEditing] = useState(false)
  const [editInput, setEditInput] = useState(initialDisplayName)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Format "member since September 2026"
  const formattedMemberSince = (() => {
    if (!createdAt) return ''
    const d = new Date(createdAt)
    if (isNaN(d.getTime())) return ''
    const month = d.toLocaleDateString('en-US', { month: 'long' })
    const year = d.getFullYear()
    return `member since ${month} ${year}`
  })()

  const handleStartEdit = () => {
    setEditInput(displayName)
    setErrorMsg(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setErrorMsg(null)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = editInput.trim()

    if (!trimmed) {
      setErrorMsg('Display name cannot be empty.')
      return
    }

    if (trimmed.length > 50) {
      setErrorMsg('Display name must be 50 characters or less.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await updateProfile(trimmed)
      if (res.success && res.data) {
        setDisplayName(res.data.display_name || trimmed)
        setIsEditing(false)
      } else {
        setErrorMsg(res.error || 'Failed to update profile.')
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setErrorMsg('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Header / Identity Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{displayName}</h1>
            {formattedMemberSince && (
              <p className="text-xs text-zinc-400 mt-1">{formattedMemberSince}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors min-h-[36px]"
              >
                Edit Profile
              </button>
            )}

            <button
              type="button"
              onClick={() => signOut()}
              className="px-3.5 py-1.5 rounded-lg border border-red-900/50 bg-red-950/30 text-xs font-semibold text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors min-h-[36px]"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Lightweight Profile Editing Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-5 pt-5 border-t border-zinc-800">
            <label htmlFor="display_name_input" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Display name
            </label>

            {errorMsg && (
              <div className="mb-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg p-2.5">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                id="display_name_input"
                type="text"
                maxLength={50}
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                placeholder="Enter display name"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                disabled={isSubmitting}
                autoFocus
              />

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white transition-colors disabled:opacity-50 min-h-[38px] flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50 min-h-[38px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Personal Statistics Grid */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 px-1">
          Activity Statistics
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <span className="text-xs text-zinc-400 block font-medium">Activity</span>
            <span className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1 block">
              {formatDuration(stats.total_duration_seconds)}
            </span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <span className="text-xs text-zinc-400 block font-medium">Active Days</span>
            <span className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1 block">
              {stats.active_days}
            </span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <span className="text-xs text-zinc-400 block font-medium">Activities</span>
            <span className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1 block">
              {stats.activity_count}
            </span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <span className="text-xs text-zinc-400 block font-medium">Subjects</span>
            <span className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1 block">
              {stats.subject_count}
            </span>
          </div>
        </div>
      </section>

      {/* Subject Summary Section */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-200">Top Subjects</h2>
          <Link
            href="/subjects"
            className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
          >
            View all subjects &rarr;
          </Link>
        </div>

        {stats.top_subjects.length === 0 ? (
          <p className="text-xs text-zinc-500 py-3">No subjects with logged activity yet.</p>
        ) : (
          <div className="space-y-2.5">
            {stats.top_subjects.map((sub) => (
              <Link
                key={sub.id}
                href={`/subjects/${sub.id}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/50 hover:border-zinc-700 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color || '#f97316' }}
                  />
                  <span className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                    {sub.name}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-zinc-400 group-hover:text-zinc-300 shrink-0 ml-3">
                  {formatDuration(sub.total_duration_seconds)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
