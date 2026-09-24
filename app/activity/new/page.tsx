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
      localStorage.removeItem('epoch_active_timer')
    } catch {
      // ignore
    }
    router.push('/')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Top bar back button */}
      <div className="w-full max-w-xl mx-auto mb-8 flex items-center justify-between">
        <Link
          href="/"
          onClick={(e) => {
            if (!stoppedData && typeof window !== 'undefined') {
              const confirmExit = window.confirm(
                'An activity is currently running. Exit to feed?'
              )
              if (!confirmExit) e.preventDefault()
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Feed
        </Link>
        <span className="text-xs text-zinc-600 font-mono">Epoch v1.0</span>
      </div>

      {/* Main View: Timer or Save Form */}
      <div className="w-full max-w-xl flex items-center justify-center">
        {!stoppedData ? (
          <ActivityTimer onStop={handleStop} />
        ) : (
          <SaveActivityForm activityData={stoppedData} onDiscard={handleDiscard} />
        )}
      </div>
    </div>
  )
}
