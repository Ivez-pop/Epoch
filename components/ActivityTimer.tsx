'use client'

import React, { useEffect, useState } from 'react'
import { formatTimerDisplay } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface StoppedActivityData {
  started_at: string
  ended_at: string
  duration_seconds: number
}

interface ActivityTimerProps {
  onStop: (data: StoppedActivityData) => void
}

export function ActivityTimer({ onStop }: ActivityTimerProps) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [startedAtIso, setStartedAtIso] = useState<string>('')
  const [elapsedMs, setElapsedMs] = useState<number>(0)
  const [storageKey, setStorageKey] = useState<string>('epoch_active_timer_anon')

  // Initialize user-namespaced active timer
  useEffect(() => {
    async function initTimer() {
      const supabase = createClient()
      let key = 'epoch_active_timer_anon'

      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          key = `epoch_active_timer_${user.id}`
        }
      }

      setStorageKey(key)

      let startTimestamp: number
      let isoString: string

      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.startedAt && parsed.startedAtIso) {
            startTimestamp = parsed.startedAt
            isoString = parsed.startedAtIso
          } else {
            startTimestamp = Date.now()
            isoString = new Date().toISOString()
            localStorage.setItem(
              key,
              JSON.stringify({ startedAt: startTimestamp, startedAtIso: isoString })
            )
          }
        } else {
          startTimestamp = Date.now()
          isoString = new Date().toISOString()
          localStorage.setItem(
            key,
            JSON.stringify({ startedAt: startTimestamp, startedAtIso: isoString })
          )
        }
      } catch {
        startTimestamp = Date.now()
        isoString = new Date().toISOString()
      }

      setStartedAt(startTimestamp)
      setStartedAtIso(isoString)
      setElapsedMs(Date.now() - startTimestamp)
    }

    initTimer()
  }, [])

  // Timer loop based strictly on timestamp comparison (Date.now() - startedAt)
  useEffect(() => {
    if (!startedAt) return

    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startedAt)
    }, 200)

    return () => clearInterval(interval)
  }, [startedAt])

  // Instantly re-calculate elapsed time when tab wakes up or regains focus
  useEffect(() => {
    if (!startedAt) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setElapsedMs(Date.now() - startedAt)
      }
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)
    window.addEventListener('pageshow', handleVisibilityChange)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
      window.removeEventListener('pageshow', handleVisibilityChange)
    }
  }, [startedAt])

  const handleStop = () => {
    if (!startedAt) return
    const now = new Date()
    const endedAtIso = now.toISOString()
    const durationSeconds = Math.max(1, Math.floor((now.getTime() - startedAt) / 1000))

    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }

    onStop({
      started_at: startedAtIso || new Date(startedAt).toISOString(),
      ended_at: endedAtIso,
      duration_seconds: durationSeconds,
    })
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl text-center backdrop-blur-xl">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3.5 py-1.5 text-xs font-medium text-orange-400 ring-1 ring-inset ring-orange-500/20">
        <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
        Activity running
      </div>

      <div className="my-6 sm:my-8 font-mono text-4xl min-[380px]:text-5xl sm:text-6xl font-extrabold tracking-tight text-zinc-100 selection:bg-orange-500/30">
        {formatTimerDisplay(elapsedMs)}
      </div>

      <div className="mt-6 sm:mt-8 flex justify-center">
        <button
          type="button"
          onClick={handleStop}
          className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 sm:py-4 text-base font-semibold text-white shadow-lg hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:scale-[0.98] transition-all touch-manipulation min-h-[48px]"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          Stop Activity
        </button>
      </div>
    </div>
  )
}
