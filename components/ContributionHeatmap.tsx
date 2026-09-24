'use client'

import React, { useState } from 'react'
import { DailyActivitySummary } from '@/lib/history'
import { formatDuration, formatFullDate } from '@/lib/utils'

interface ContributionHeatmapProps {
  year: number
  historyMap: Record<string, DailyActivitySummary>
  selectedDate: string | null
  onSelectDate: (dateStr: string) => void
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

/**
 * Determine heatmap cell intensity level based on daily duration in seconds.
 * 0 min = level 0
 * 1-29 min = level 1
 * 30-59 min = level 2
 * 60-119 min = level 3
 * 120+ min = level 4
 */
function getIntensityLevel(seconds: number): number {
  if (!seconds || seconds <= 0) return 0
  const minutes = seconds / 60
  if (minutes < 30) return 1
  if (minutes < 60) return 2
  if (minutes < 120) return 3
  return 4
}

function getLevelClasses(level: number, isSelected: boolean): string {
  const base = 'w-3 h-3 rounded-[3px] transition-all cursor-pointer touch-manipulation'
  const ring = isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-110 z-10' : 'hover:scale-110'

  switch (level) {
    case 1:
      return `${base} ${ring} bg-orange-950/80 border border-orange-800/60`
    case 2:
      return `${base} ${ring} bg-orange-800/80 border border-orange-700/80`
    case 3:
      return `${base} ${ring} bg-orange-600 border border-orange-500`
    case 4:
      return `${base} ${ring} bg-orange-500 border border-orange-400 shadow-sm shadow-orange-500/40`
    default:
      return `${base} ${ring} bg-zinc-900/80 border border-zinc-800/60 hover:border-zinc-700`
  }
}

export function ContributionHeatmap({
  year,
  historyMap,
  selectedDate,
  onSelectDate,
}: ContributionHeatmapProps) {
  const [hoveredData, setHoveredData] = useState<{
    date: string
    duration: number
    count: number
  } | null>(null)

  // Generate matrix of dates for the 52/53 weeks of the specified year
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)

  // Align start to the preceding Sunday
  const startDate = new Date(jan1)
  startDate.setDate(jan1.getDate() - jan1.getDay())

  // Generate weeks
  const weeks: { date: Date; dateStr: string; inYear: boolean }[][] = []
  let curr = new Date(startDate)

  while (curr <= dec31 || curr.getDay() !== 0) {
    const week: { date: Date; dateStr: string; inYear: boolean }[] = []
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const yearNum = curr.getFullYear()
      const monthStr = String(curr.getMonth() + 1).padStart(2, '0')
      const dayStr = String(curr.getDate()).padStart(2, '0')
      const dateStr = `${yearNum}-${monthStr}-${dayStr}`
      const inYear = curr.getFullYear() === year

      week.push({ date: new Date(curr), dateStr, inYear })
      curr.setDate(curr.getDate() + 1)
    }
    weeks.push(week)
    if (curr > dec31 && curr.getDay() === 0) break
  }

  // Calculate month label positions
  const monthHeaders: { label: string; weekIndex: number }[] = []
  let lastMonth = -1

  weeks.forEach((week, wIndex) => {
    const firstDayInYear = week.find((d) => d.inYear)
    if (firstDayInYear) {
      const m = firstDayInYear.date.getMonth()
      if (m !== lastMonth) {
        monthHeaders.push({ label: MONTH_NAMES[m], weekIndex: wIndex })
        lastMonth = m
      }
    }
  })

  return (
    <div className="w-full bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-4 sm:p-6 backdrop-blur-xl">
      {/* Tooltip / Hover Bar */}
      <div className="h-7 mb-3 flex items-center justify-between text-xs text-zinc-400 px-1">
        {hoveredData ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-200">{formatFullDate(hoveredData.date)}</span>
            <span className="text-zinc-600">·</span>
            <span className="font-mono font-bold text-orange-400">
              {formatDuration(hoveredData.duration)}
            </span>
            <span className="text-zinc-600">·</span>
            <span>
              {hoveredData.count} {hoveredData.count === 1 ? 'activity' : 'activities'}
            </span>
          </div>
        ) : selectedDate ? (
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Selected:</span>
            <span className="font-semibold text-zinc-200">{formatFullDate(selectedDate)}</span>
            <span className="text-zinc-600">·</span>
            <span className="font-mono font-bold text-orange-400">
              {formatDuration(historyMap[selectedDate]?.total_duration_seconds || 0)}
            </span>
          </div>
        ) : (
          <div className="text-zinc-500 italic">Select or hover over a day to view activity</div>
        )}
      </div>

      {/* Heatmap Grid Container with Horizontal Scroll for Mobile */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="min-w-[700px] inline-block">
          {/* Month Headers */}
          <div className="flex text-[10px] text-zinc-500 font-medium mb-1.5 pl-7">
            {monthHeaders.map((m, i) => {
              const nextCol = monthHeaders[i + 1]?.weekIndex || weeks.length
              const colSpan = nextCol - m.weekIndex
              return (
                <div key={i} style={{ width: `${colSpan * 15}px` }} className="shrink-0 truncate">
                  {m.label}
                </div>
              )
            })}
          </div>

          {/* Grid Rows (Days of Week) */}
          <div className="flex">
            {/* Day Labels (Left Column) */}
            <div className="flex flex-col justify-between text-[10px] text-zinc-500 font-medium pr-2 shrink-0 py-0.5 select-none w-7">
              {DAY_LABELS.map((lbl, idx) => (
                <span key={idx} className="h-3 leading-3">
                  {lbl}
                </span>
              ))}
            </div>

            {/* Heatmap Columns (Weeks) */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => {
                    if (!day.inYear) {
                      return <div key={dIdx} className="w-3 h-3 rounded-[3px] opacity-0" />
                    }

                    const data = historyMap[day.dateStr] || {
                      date: day.dateStr,
                      total_duration_seconds: 0,
                      activity_count: 0,
                    }

                    const level = getIntensityLevel(data.total_duration_seconds)
                    const isSelected = selectedDate === day.dateStr

                    return (
                      <div
                        key={dIdx}
                        onClick={() => onSelectDate(day.dateStr)}
                        onMouseEnter={() =>
                          setHoveredData({
                            date: day.dateStr,
                            duration: data.total_duration_seconds,
                            count: data.activity_count,
                          })
                        }
                        onMouseLeave={() => setHoveredData(null)}
                        className={getLevelClasses(level, isSelected)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
        <span>Daily time spent</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <div className="flex items-center gap-[3px]">
            <div className="w-3 h-3 rounded-[3px] bg-zinc-900/80 border border-zinc-800/60" title="0 min" />
            <div className="w-3 h-3 rounded-[3px] bg-orange-950/80 border border-orange-800/60" title="1–29 min" />
            <div className="w-3 h-3 rounded-[3px] bg-orange-800/80 border border-orange-700/80" title="30–59 min" />
            <div className="w-3 h-3 rounded-[3px] bg-orange-600 border border-orange-500" title="60–119 min" />
            <div className="w-3 h-3 rounded-[3px] bg-orange-500 border border-orange-400" title="120+ min" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
