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
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header / Identity Card */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-zinc-100">{displayName}</h1>
              {formattedMemberSince && (
                <p className="text-sm text-zinc-400 mt-2">{formattedMemberSince}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-4 py-2 rounded-xl border border-zinc-700/80 bg-zinc-800/80 text-xs sm:text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors min-h-[40px]"
                >
                  Edit Profile
                </button>
              )}

              <button
                type="button"
                onClick={() => signOut()}
                className="px-4 py-2 rounded-xl border border-red-900/50 bg-red-950/30 text-xs sm:text-sm font-medium text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors min-h-[40px]"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Lightweight Profile Editing Form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-zinc-800/80">
              <label htmlFor="display_name_input" className="block text-xs font-medium text-zinc-300 mb-2">
                Display name
              </label>

              {errorMsg && (
                <div className="mb-4 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl p-3">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  id="display_name_input"
                  type="text"
                  maxLength={50}
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  placeholder="Enter display name"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  disabled={isSubmitting}
                  autoFocus
                />

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs sm:text-sm font-semibold text-white transition-colors disabled:opacity-50 min-h-[42px] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
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
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-zinc-700/80 text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50 min-h-[42px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Personal Statistics Grid */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4 px-1">
            Activity Statistics
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
              <span className="text-xs text-zinc-400 block font-medium">Activity</span>
              <span className="text-xl sm:text-3xl font-bold font-mono text-zinc-100 mt-2 block">
                {formatDuration(stats.total_duration_seconds)}
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
              <span className="text-xs text-zinc-400 block font-medium">Active Days</span>
              <span className="text-xl sm:text-3xl font-bold text-zinc-100 mt-2 block">
                {stats.active_days}
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
              <span className="text-xs text-zinc-400 block font-medium">Activities</span>
              <span className="text-xl sm:text-3xl font-bold text-zinc-100 mt-2 block">
                {stats.activity_count}
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
              <span className="text-xs text-zinc-400 block font-medium">Subjects</span>
              <span className="text-xl sm:text-3xl font-bold text-zinc-100 mt-2 block">
                {stats.subject_count}
              </span>
            </div>
          </div>
        </section>

        {/* Subject Summary Section */}
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-zinc-200">Top Subjects</h2>
            <Link
              href="/subjects"
              className="text-xs sm:text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
            >
              View all subjects &rarr;
            </Link>
          </div>

          {stats.top_subjects.length === 0 ? (
            <p className="text-sm text-zinc-500 py-3">No subjects with logged activity yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.top_subjects.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/subjects/${sub.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/50 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || '#f97316' }}
                    />
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                      {sub.name}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-medium text-zinc-400 group-hover:text-zinc-300 shrink-0 ml-3">
                    {formatDuration(sub.total_duration_seconds)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
