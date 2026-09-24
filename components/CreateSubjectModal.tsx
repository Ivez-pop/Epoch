'use client'

import React, { useState } from 'react'
import { createSubject } from '@/lib/subjects'
import { Subject } from '@/lib/supabase'

interface CreateSubjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newSubject: Subject) => void
}

const COLOR_PRESETS = [
  { hex: '#f97316', label: 'Orange' },
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#8b5cf6', label: 'Purple' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#eab308', label: 'Yellow' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#64748b', label: 'Slate' },
]

export function CreateSubjectModal({ isOpen, onClose, onSuccess }: CreateSubjectModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#f97316')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Subject name is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createSubject(trimmed, color)
      if (result.success && result.data) {
        // Local fallback store sync if Supabase is offline
        try {
          const stored = localStorage.getItem('epoch_local_subjects')
          const existing: Subject[] = stored ? JSON.parse(stored) : []
          if (!existing.some((s) => s.id === result.data!.id)) {
            existing.push(result.data)
            localStorage.setItem('epoch_local_subjects', JSON.stringify(existing))
          }
        } catch {
          // ignore
        }

        setName('')
        setColor('#f97316')
        onSuccess(result.data)
        onClose()
      } else {
        // Check if offline/demo fallback should create local subject
        if (result.error && result.error.includes('Supabase credentials are not configured')) {
          const localSub: Subject = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            name: trimmed,
            color: color || '#f97316',
            created_at: new Date().toISOString(),
          }
          try {
            const stored = localStorage.getItem('epoch_local_subjects')
            const existing: Subject[] = stored ? JSON.parse(stored) : []
            if (existing.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
              setError('A subject with this name already exists.')
              setIsSubmitting(false)
              return
            }
            existing.push(localSub)
            localStorage.setItem('epoch_local_subjects', JSON.stringify(existing))
            setName('')
            setColor('#f97316')
            onSuccess(localSub)
            onClose()
            return
          } catch {
            // ignore
          }
        }
        setError(result.error || 'Failed to create subject.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-100">Create Subject</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="subject-name" className="block text-sm font-medium text-zinc-200 mb-1.5">
              Name <span className="text-orange-400">*</span>
            </label>
            <input
              id="subject-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kafka"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">Color</label>
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setColor(preset.hex)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    color === preset.hex ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.label}
                />
              ))}
              <div className="relative inline-flex items-center">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer opacity-0 absolute inset-0"
                />
                <div
                  className="w-7 h-7 rounded-full border border-dashed border-zinc-600 flex items-center justify-center text-xs text-zinc-400"
                  style={{ backgroundColor: color }}
                  title="Custom Color"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
