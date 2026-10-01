'use client'

import React from 'react'
import { formatTimerDisplay } from '@/lib/utils'

interface RaceTrackSVGProps {
  lapProgress: number // 0.0 to 1.0
  elapsedMs: number
  lapDurationMs: number
  completedLaps: number
  isPaused: boolean
  subjectName?: string
}

function formatMinSec(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function RaceTrackSVG({
  lapProgress,
  elapsedMs,
  lapDurationMs,
  completedLaps,
  isPaused,
  subjectName,
}: RaceTrackSVGProps) {
  const radius = 225
  const circumference = 2 * Math.PI * radius // ~1413.7166
  const safeProgress = Math.min(1, Math.max(0, isNaN(lapProgress) ? 0 : lapProgress))
  const dashOffset = circumference * (1 - safeProgress)
  const angle = safeProgress * 360

  return (
    <div className="relative w-[300px] h-[300px] sm:w-[460px] sm:h-[460px] lg:w-[520px] lg:h-[520px] flex items-center justify-center select-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 540 540"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Strava / Epoch Orange Gradient */}
          <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FC5200" />
            <stop offset="100%" stopColor="#FF7A3D" />
          </linearGradient>
          {/* Marker Vehicle Glow Filter */}
          <filter id="vehicleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Cadence Index Ring */}
        <circle cx="270" cy="270" r="260" fill="none" stroke="rgba(240, 246, 252, 0.05)" strokeWidth="1" />

        {/* Precision Radial Telemetry Tick Marks */}
        <g stroke="rgba(240, 246, 252, 0.12)" strokeWidth="1.2">
          {/* 12 o'clock notch */}
          <line x1="270" y1="14" x2="270" y2="30" stroke="#FC5200" strokeWidth="3" />
          {/* Quarter Cardinal Markers */}
          <line x1="510" y1="270" x2="526" y2="270" stroke="rgba(240, 246, 252, 0.4)" strokeWidth="2" />
          <line x1="270" y1="510" x2="270" y2="526" stroke="rgba(240, 246, 252, 0.4)" strokeWidth="2" />
          <line x1="14" y1="270" x2="30" y2="270" stroke="rgba(240, 246, 252, 0.4)" strokeWidth="2" />
          {/* 30 deg intervals */}
          <g stroke="rgba(240, 246, 252, 0.25)" strokeWidth="1.5">
            <line x1="392" y1="58" x2="398" y2="70" />
            <line x1="482" y1="148" x2="470" y2="154" />
            <line x1="482" y1="392" x2="470" y2="386" />
            <line x1="392" y1="482" x2="398" y2="470" />
            <line x1="148" y1="482" x2="154" y2="470" />
            <line x1="58" y1="392" x2="70" y2="386" />
            <line x1="58" y1="148" x2="70" y2="154" />
            <line x1="148" y1="58" x2="154" y2="70" />
          </g>
        </g>

        {/* Base Dark Track Roadbed */}
        <circle cx="270" cy="270" r="225" fill="none" stroke="#161B22" strokeWidth="12" />

        {/* Inner Guidance Guide Rail */}
        <circle cx="270" cy="270" r="217" fill="none" stroke="rgba(240, 246, 252, 0.04)" strokeWidth="1" />

        {/* Active Progress Telemetry Arc */}
        <circle
          cx="270"
          cy="270"
          r="225"
          fill="none"
          stroke="url(#orbitGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-200 origin-center -rotate-90"
        />

        {/* Start/Finish Datum Gate at 12 O'Clock */}
        <g transform="translate(270, 45)">
          <rect x="-1.25" y="-9" width="2.5" height="18" fill="#FFFFFF" opacity="0.95" />
          <polygon points="0,-14 -4,-21 4,-21" fill="#FC5200" />
        </g>

        {/* Vehicle Telemetry Cursor Marker */}
        <g
          filter="url(#vehicleGlow)"
          transform={`rotate(${angle.toFixed(2)}, 270, 270) translate(270, 45)`}
        >
          <circle cx="0" cy="0" r="14" fill="rgba(252, 82, 0, 0.35)" />
          <circle cx="0" cy="0" r="7.5" fill="#FC5200" stroke="#FFFFFF" strokeWidth="2.2" />
          <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
        </g>
      </svg>

      {/* Center Telemetry Cluster HUD */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-[260px] sm:max-w-[320px]">
        {/* Subject Chip */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#161B22]/90 border border-[#30363D] mb-1.5 sm:mb-2">
          <span className="w-2 h-2 rounded-full bg-[#FC5200] shadow-[0_0_8px_#FC5200]" />
          <span className="text-[10px] sm:text-xs font-mono font-medium text-white tracking-wider uppercase truncate max-w-[180px]">
            {subjectName || 'FOCUS SESSION'}
          </span>
        </div>

        {/* Label */}
        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#8B949E] uppercase mb-0.5">
          TOTAL ELAPSED SESSION
        </span>

        {/* Hero Timer */}
        <div className="font-mono font-bold text-4xl sm:text-6xl text-white tracking-tight drop-shadow-md">
          {formatTimerDisplay(elapsedMs)}
        </div>

        {/* Lap State & Progress */}
        <div className="mt-2 sm:mt-3 flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-[#FC5200]/15 text-[#FC5200] border border-[#FC5200]/30 tracking-wider">
              {isPaused
                ? 'PAUSED'
                : `LAP ${String(completedLaps + 1).padStart(2, '0')} IN PROGRESS`}
            </span>
          </div>

          <div className="mt-1.5 flex items-baseline space-x-1.5 font-mono">
            <span className="text-xs text-[#8B949E] uppercase tracking-wider">LAP SPLIT:</span>
            <span className="text-sm sm:text-base font-bold text-[#FC5200]">
              {formatMinSec(elapsedMs % lapDurationMs)}
            </span>
            <span className="text-xs text-[#8B949E] font-medium">
              / {formatMinSec(lapDurationMs)}
            </span>
            <span className="text-[11px] text-[#8B949E] ml-1">
              ({(safeProgress * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
