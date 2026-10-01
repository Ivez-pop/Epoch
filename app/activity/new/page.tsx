'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ActivityTimer } from '@/components/ActivityTimer'
import { SaveActivityForm } from '@/components/SaveActivityForm'

interface StoppedActivityData {
  started_at: string
  ended_at: string
  duration_seconds: number
}

export default function NewActivityPage() {
  const router = useRouter()
  const [stoppedData, setStoppedData] = useState<StoppedActivityData | null>(null)

  const handleStop = (data: StoppedActivityData) => {
    setStoppedData(data)
  }

  const handleDiscard = () => {
    try {
      localStorage.removeItem('epoch_active_timer_anon')
    } catch {
      // ignore
    }
    router.push('/')
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-[#080A0E] text-[#C9D1D9] flex flex-col justify-between font-sans selection:bg-[#FC5200]/30 select-none">
      {/* Top Header System Chrome */}
      <header className="w-full border-b border-[#21262D]/60 bg-[#0D1117]/80 backdrop-blur-md px-4 sm:px-8 py-3 z-30 flex-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Logo & Session Breadcrumb */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/"
              onClick={(e) => {
                if (!stoppedData && typeof window !== 'undefined') {
                  const confirmExit = window.confirm('An active telemetry session is currently running. Exit to feed?')
                  if (!confirmExit) e.preventDefault()
                }
              }}
              className="flex items-center gap-2 group"
            >
              <div className="w-7 h-7 rounded-md bg-[#FC5200] flex items-center justify-center shadow-lg shadow-[#FC5200]/25 group-hover:bg-[#FF671F] transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </div>
              <span className="font-bold tracking-tight text-white text-base font-mono">EPOCH</span>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-[#FC5200]/20 text-[#FC5200] border border-[#FC5200]/40 font-bold">
                TEL
              </span>
            </Link>
            <div className="h-4 w-px bg-[#30363D]" />
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-[#8B949E] tracking-wider uppercase hidden sm:inline">
                Active Circuit
              </span>
              <span className="text-xs text-[#30363D] hidden sm:inline">/</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FC5200]" />
                <span className="text-xs font-medium text-white truncate max-w-[140px] sm:max-w-none">
                  Focus Session
                </span>
              </div>
            </div>
          </div>

          {/* Center: Live Telemetry Status */}
          <div className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-[#161B22] border border-[#30363D]">
            <div className="w-2 h-2 rounded-full bg-[#FC5200] animate-pulse" />
            <span className="font-mono text-xs text-white font-medium tracking-wide">LIVE TELEMETRY</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="text-xs font-mono px-2.5 py-1.5 rounded-md bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors flex items-center gap-1.5"
              title="Toggle Fullscreen (Hotkey: F)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              <span className="hidden sm:inline">Focus</span>
              <kbd className="hidden xl:inline-block text-[9px] px-1 bg-[#21262D] text-[#8B949E] rounded border border-[#30363D]">
                F
              </kbd>
            </button>
            <Link
              href="/"
              onClick={(e) => {
                if (!stoppedData && typeof window !== 'undefined') {
                  const confirmExit = window.confirm('Exit active telemetry session?')
                  if (!confirmExit) e.preventDefault()
                }
              }}
              className="text-xs font-mono px-2.5 py-1.5 rounded-md bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors"
            >
              Feed
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-4 py-4 overflow-hidden">
        {!stoppedData ? (
          <ActivityTimer onStop={handleStop} />
        ) : (
          <div className="w-full max-w-2xl py-8">
            <SaveActivityForm activityData={stoppedData} onDiscard={handleDiscard} />
          </div>
        )}
      </main>

      {/* Bottom Telemetry Dock */}
      <footer className="w-full border-t border-[#21262D]/70 bg-[#0D1117] px-4 sm:px-8 py-3 z-20 flex-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-[#8B949E]">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-sm bg-[#FC5200]" />
              <span className="text-[#8B949E]">SUBJECT:</span>
              <span className="text-white font-medium">Focus Session</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-3.5 h-3.5 text-[#3FB950]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[#8B949E]">STATUS:</span>
              <span className="text-white font-medium">Active Cadence</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <div className="flex items-center space-x-1.5 text-[#3FB950]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950]" />
              <span>Local-first active</span>
            </div>
            <span className="text-[#30363D]">|</span>
            <span className="text-[#8B949E]">Epoch Telemetry Engine</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

