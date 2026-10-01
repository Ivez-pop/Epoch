'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { RaceTrackSVG } from './RaceTrackSVG'
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

  const [lapDurationMinutes, setLapDurationMinutes] = useState<number>(25)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [accumulatedPausedMs, setAccumulatedPausedMs] = useState<number>(0)
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false)
  const [customInputVal, setCustomInputVal] = useState<string>('30')

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
      let lapMins = 25
      let pausedState = false
      let pAt: number | null = null
      let accPaused = 0

      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.startedAt && parsed.startedAtIso) {
            startTimestamp = parsed.startedAt
            isoString = parsed.startedAtIso
            if (typeof parsed.lapDurationMinutes === 'number') {
              lapMins = parsed.lapDurationMinutes
            }
            if (typeof parsed.isPaused === 'boolean') {
              pausedState = parsed.isPaused
            }
            if (typeof parsed.pausedAt === 'number') {
              pAt = parsed.pausedAt
            }
            if (typeof parsed.accumulatedPausedMs === 'number') {
              accPaused = parsed.accumulatedPausedMs
            }
          } else {
            startTimestamp = Date.now()
            isoString = new Date().toISOString()
          }
        } else {
          startTimestamp = Date.now()
          isoString = new Date().toISOString()
        }
      } catch {
        startTimestamp = Date.now()
        isoString = new Date().toISOString()
      }

      setStartedAt(startTimestamp)
      setStartedAtIso(isoString)
      setLapDurationMinutes(lapMins)
      setIsPaused(pausedState)
      setPausedAt(pAt)
      setAccumulatedPausedMs(accPaused)

      if (pausedState && pAt) {
        setElapsedMs(Math.max(0, pAt - startTimestamp - accPaused))
      } else {
        setElapsedMs(Math.max(0, Date.now() - startTimestamp - accPaused))
      }
    }

    initTimer()
  }, [])

  // Persist timer state updates to localStorage
  useEffect(() => {
    if (!startedAt || !storageKey) return
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          startedAt,
          startedAtIso,
          lapDurationMinutes,
          isPaused,
          pausedAt,
          accumulatedPausedMs,
        })
      )
    } catch {
      // ignore storage error
    }
  }, [startedAt, startedAtIso, storageKey, lapDurationMinutes, isPaused, pausedAt, accumulatedPausedMs])

  // Timer refresh loop
  useEffect(() => {
    if (!startedAt || isPaused) return

    const interval = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startedAt - accumulatedPausedMs))
    }, 100)

    return () => clearInterval(interval)
  }, [startedAt, isPaused, accumulatedPausedMs])

  // Recalculate on focus / tab wake
  useEffect(() => {
    if (!startedAt || isPaused) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setElapsedMs(Math.max(0, Date.now() - startedAt - accumulatedPausedMs))
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
  }, [startedAt, isPaused, accumulatedPausedMs])

  const handleTogglePause = () => {
    if (isPaused) {
      // Resume
      const now = Date.now()
      const pauseDuration = pausedAt ? now - pausedAt : 0
      const newAcc = accumulatedPausedMs + pauseDuration
      setAccumulatedPausedMs(newAcc)
      setPausedAt(null)
      setIsPaused(false)
      if (startedAt) {
        setElapsedMs(Math.max(0, now - startedAt - newAcc))
      }
    } else {
      // Pause
      const now = Date.now()
      setPausedAt(now)
      setIsPaused(true)
      if (startedAt) {
        setElapsedMs(Math.max(0, now - startedAt - accumulatedPausedMs))
      }
    }
  }

  const handleStop = useCallback(() => {
    if (!startedAt) return
    const now = new Date()
    const endedAtIso = now.toISOString()
    const activeElapsedSec = Math.max(1, Math.floor(elapsedMs / 1000))

    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }

    onStop({
      started_at: startedAtIso || new Date(startedAt).toISOString(),
      ended_at: endedAtIso,
      duration_seconds: activeElapsedSec,
    })
  }, [startedAt, elapsedMs, storageKey, startedAtIso, onStop])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        showCustomModal
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        handleStop()
      } else if (e.key === '1') {
        setLapDurationMinutes(15)
      } else if (e.key === '2') {
        setLapDurationMinutes(25)
      } else if (e.key === '3') {
        setLapDurationMinutes(45)
      } else if (e.key === '4') {
        setLapDurationMinutes(60)
      } else if (e.key.toLowerCase() === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
        } else {
          document.exitFullscreen().catch(() => {})
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleStop, showCustomModal])

  const lapDurationMs = lapDurationMinutes * 60 * 1000
  const completedLaps = Math.floor(elapsedMs / lapDurationMs)
  const timeIntoLap = elapsedMs % lapDurationMs
  const lapProgress = lapDurationMs > 0 ? timeIntoLap / lapDurationMs : 0

  const startedTimeFormatted = startedAt
    ? new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const mins = parseInt(customInputVal, 10)
    if (!isNaN(mins) && mins > 0 && mins <= 240) {
      setLapDurationMinutes(mins)
      setShowCustomModal(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[calc(100vh-140px)] py-4 select-none">
      {/* Milestone Pill Notification */}
      <div className="mb-2 z-10 flex items-center space-x-2 px-3 py-1 rounded-full bg-[#161B22]/90 border border-[#30363D] shadow-inner text-xs font-mono text-[#8B949E]">
        <svg className="w-3.5 h-3.5 text-[#FC5200]" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          {completedLaps > 0 ? (
            <>
              PREVIOUS MILESTONE:{' '}
              <strong className="text-white font-semibold">
                LAP {String(completedLaps).padStart(2, '0')} COMPLETE
              </strong>{' '}
              · {lapDurationMinutes}:00.00
            </>
          ) : (
            <>
              ACTIVE TELEMETRY · SESSION STARTED AT <strong className="text-white font-semibold">{startedTimeFormatted}</strong>
            </>
          )}
        </span>
      </div>

      {/* Central Race Track Component */}
      <div className="my-4 flex items-center justify-center">
        <RaceTrackSVG
          lapProgress={lapProgress}
          elapsedMs={elapsedMs}
          lapDurationMs={lapDurationMs}
          completedLaps={completedLaps}
          isPaused={isPaused}
          subjectName="Focus Session"
        />
      </div>

      {/* Segmented Lap Duration Selector */}
      <div className="mt-2 flex flex-col items-center space-y-1.5 z-10">
        <div className="flex items-center space-x-2 text-[11px] font-mono text-[#8B949E] uppercase tracking-wider">
          <span>Lap Segment Cadence</span>
          <span className="text-[#30363D]">•</span>
          <span>Keyboard: [1] [2] [3] [4]</span>
        </div>
        <div className="inline-flex p-1 rounded-xl bg-[#0D1117] border border-[#30363D] shadow-lg shadow-black/40">
          {[15, 25, 45, 60].map((mins, idx) => {
            const isActive = lapDurationMinutes === mins
            return (
              <button
                key={mins}
                type="button"
                onClick={() => setLapDurationMinutes(mins)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg font-mono text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#161B22] text-[#FC5200] border border-[#FC5200]/40 shadow-sm'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                {mins}m {isActive && '(Active)'}{' '}
                <span className={`hidden sm:inline-block text-[10px] ml-0.5 ${isActive ? 'text-[#FC5200]/70' : 'text-[#484F58]'}`}>
                  · {idx + 1}
                </span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-all duration-150 border-l border-[#21262D] ${
              ![15, 25, 45, 60].includes(lapDurationMinutes)
                ? 'bg-[#161B22] text-[#FC5200] border border-[#FC5200]/40'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Primary Control Triggers */}
      <div className="mt-4 z-10 flex items-center space-x-3">
        {/* Pause / Resume Toggle */}
        <button
          type="button"
          onClick={handleTogglePause}
          className={`px-4 py-2.5 rounded-xl bg-[#161B22] hover:bg-[#21262D] text-white border font-mono text-xs font-semibold tracking-wider flex items-center space-x-2 transition-all active:scale-[0.98] ${
            isPaused ? 'border-[#FC5200]' : 'border-[#30363D]'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-[#FC5200]" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z"
              clipRule="evenodd"
            />
          </svg>
          <span>{isPaused ? 'RESUME CADENCE' : 'HOLD / PAUSE'}</span>
        </button>

        {/* Finish Activity Button */}
        <button
          type="button"
          onClick={handleStop}
          className="px-6 py-2.5 rounded-xl bg-[#FC5200] hover:bg-[#FF671F] text-white font-mono text-xs font-bold tracking-wider uppercase flex items-center space-x-2.5 shadow-lg shadow-[#FC5200]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="w-2.5 h-2.5 bg-white rounded-xs" />
          <span>STOP ACTIVITY & LOG</span>
          <kbd className="px-1.5 py-0.5 text-[9px] bg-black/30 text-white rounded border border-white/20 ml-1">
            SPACE
          </kbd>
        </button>
      </div>

      {/* Custom Duration Dialog */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCustomSubmit}
            className="w-full max-w-xs bg-[#0D1117] border border-[#30363D] rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <h3 className="font-mono text-sm font-semibold text-white">Custom Lap Segment (Minutes)</h3>
            <input
              type="number"
              min="1"
              max="240"
              value={customInputVal}
              onChange={(e) => setCustomInputVal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-white font-mono text-sm focus:outline-none focus:border-[#FC5200]"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#8B949E] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#FC5200] text-white hover:bg-[#FF671F]"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

