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

/**
 * Static mapping of cell backgrounds and borders for strong visual progression.
 * Level 0: Empty (#20262e / #303740)
 * Level 1: Low (#164e32 / #216b43)
 * Level 2: Medium (#167347 / #238b56)
 * Level 3: High (#20a65a / #32bd6b)
 * Level 4: Very High (#39d56f / #55e889)
 */
const LEVEL_STYLES: Record<number, { bg: string; border: string }> = {
  0: { bg: 'bg-[#20262e]', border: 'border-[#303740]' },
  1: { bg: 'bg-[#164e32]', border: 'border-[#216b43]' },
  2: { bg: 'bg-[#167347]', border: 'border-[#238b56]' },
  3: { bg: 'bg-[#20a65a]', border: 'border-[#32bd6b]' },
  4: { bg: 'bg-[#39d56f]', border: 'border-[#55e889]' },
}

function getCellClasses(
  level: number,
  isToday: boolean,
  isSelected: boolean
): string {
  const base =
    'w-[16px] h-[16px] sm:w-[17px] sm:h-[17px] lg:w-[18px] lg:h-[18px] rounded-[3px] cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-strava relative shrink-0 block border'
  const style = LEVEL_STYLES[level] || LEVEL_STYLES[0]

  // State hierarchy:
  // TODAY + SELECTED: Orange outer border + white ring + subtle glow
  if (isToday && isSelected) {
    return `${base} ${style.bg} ${style.border} ring-2 ring-strava ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(252,82,0,0.6)] scale-110 z-30`
  }

  // SELECTED: White border emphasis + scale
  if (isSelected) {
    return `${base} ${style.bg} border-white ring-2 ring-white scale-110 z-20 shadow-md`
  }

  // TODAY: Orange 2px ring + subtle orange glow
  if (isToday) {
    return `${base} ${style.bg} ${style.border} ring-2 ring-strava shadow-[0_0_10px_rgba(252,82,0,0.5)] scale-105 z-20`
  }

  // NORMAL CELL
  return `${base} ${style.bg} ${style.border} hover:ring-1.5 hover:ring-strava hover:scale-110 hover:z-20`
}

function getTodayLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getAriaLabel(
  dateStr: string,
  durationSeconds: number,
  activityCount: number,
  isToday: boolean,
  isSelected: boolean
): string {
  const fullDate = formatFullDate(dateStr)
  const durationText = durationSeconds > 0 ? formatDuration(durationSeconds) : 'no activity'
  const countText =
    activityCount > 0 ? `${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}` : ''
  const todayText = isToday ? ' — Today' : ''
  const selectedText = isSelected ? ' — Selected' : ''

  if (durationSeconds > 0) {
    return `${fullDate}${todayText}${selectedText} — ${durationText}${countText ? `, ${countText}` : ''}`
  }
  return `${fullDate}${todayText}${selectedText} — No activity`
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

  const todayStr = getTodayLocalDateString()

  // Generate matrix of dates for the 52/53 weeks of the specified year
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)

  // Align start to preceding Monday (0 = Monday)
  const startDate = new Date(jan1)
  const dayOffset = (jan1.getDay() + 6) % 7
  startDate.setDate(jan1.getDate() - dayOffset)

  // Generate weeks
  const weeks: { date: Date; dateStr: string; inYear: boolean }[][] = []
  let curr = new Date(startDate)

  while (curr <= dec31 || (curr.getDay() + 6) % 7 !== 0) {
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
    if (curr > dec31 && (curr.getDay() + 6) % 7 === 0) break
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
    <div className="w-full space-y-3">
      {/* Tooltip / Hover Information Header */}
      <div className="min-h-[28px] flex items-center justify-between text-xs font-mono text-github-muted bg-[#161b22] px-3 py-1.5 rounded-lg border border-github-border/60">
        {hoveredData ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-github-bright">{formatFullDate(hoveredData.date)}</span>
            <span>•</span>
            <span className="font-bold text-strava">
              {hoveredData.duration > 0 ? `${formatDuration(hoveredData.duration)} logged` : 'No activity'}
            </span>
            {hoveredData.count > 0 && (
              <>
                <span>•</span>
                <span>
                  {hoveredData.count} {hoveredData.count === 1 ? 'activity' : 'activities'}
                </span>
              </>
            )}
            {hoveredData.date === todayStr && (
              <span className="bg-strava/20 text-strava px-1.5 py-0.5 rounded text-[10px] font-bold border border-strava/40">
                TODAY
              </span>
            )}
          </div>
        ) : selectedDate ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-github-muted">Selected:</span>
            <span className="font-semibold text-github-bright">{formatFullDate(selectedDate)}</span>
            <span>•</span>
            <span className="font-bold text-strava">
              {historyMap[selectedDate]?.total_duration_seconds
                ? `${formatDuration(historyMap[selectedDate].total_duration_seconds)} logged`
                : 'No activity'}
            </span>
            {selectedDate === todayStr && (
              <span className="bg-strava/20 text-strava px-1.5 py-0.5 rounded text-[10px] font-bold border border-strava/40">
                TODAY
              </span>
            )}
          </div>
        ) : (
          <div className="text-github-muted italic text-[11px]">
            Click or hover over any day cell to inspect focus telemetry
          </div>
        )}
      </div>

      {/* Heatmap Matrix Viewport */}
      <div className="overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-github-border">
        <div className="inline-block min-w-full">
          {/* Months Header with Precise Left Offsets */}
          <div className="relative h-5 text-[11px] sm:text-xs font-mono font-medium text-github-muted mb-2 select-none">
            {monthHeaders.map((m, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  left: `calc(${m.weekIndex} * (16px + 4px) + 32px)`,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Heatmap Grid with Days of Week */}
          <div className="flex items-start gap-2">
            {/* Day indicator labels */}
            <div className="grid grid-rows-7 gap-1 text-[11px] font-mono text-github-muted pr-1 pt-0.5 select-none w-[26px] shrink-0">
              <span className="h-[16px] sm:h-[17px] lg:h-[18px] leading-[16px] sm:leading-[17px] lg:leading-[18px]">Mon</span>
              <span className="h-[16px] sm:h-[17px] lg:h-[18px] leading-[16px] sm:leading-[17px] lg:leading-[18px] opacity-0">Tue</span>
              <span className="h-[16px] sm:h-[17px] lg:h-[18px] leading-[16px] sm:leading-[17px] lg:leading-[18px]">Wed</span>
              <span className="h-[16px] sm:h-[17px] lg:h-[18px] leading-[16px] sm:leading-[17px] lg:leading-[18px] opacity-0">Thu</span>
              <span className="h-[16px] sm:h-[17px] lg:h-[18px] leading-[16px] sm:leading-[17px] lg:leading-[18px]">Fri</span>
              <span className="h-[16px] sm:h-[17px] lg:h-[18px] leading-[16px] sm:leading-[17px] lg:leading-[18px] opacity-0">Sat</span>
              <span className="h-[16px] sm:h-[17px] lg:h-[18px] leading-[16px] sm:leading-[17px] lg:leading-[18px]">Sun</span>
            </div>

            {/* Matrix Columns Container */}
            <div className="flex items-center gap-1 shrink-0">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-rows-7 gap-1 w-[16px] sm:w-[17px] lg:w-[18px] shrink-0">
                  {week.map((day, dIdx) => {
                    if (!day.inYear) {
                      return (
                        <div
                          key={dIdx}
                          className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px] lg:w-[18px] lg:h-[18px] rounded-[3px] bg-[#20262e]/30 border border-[#303740]/20 opacity-20 shrink-0"
                        />
                      )
                    }

                    const data = historyMap[day.dateStr] || {
                      date: day.dateStr,
                      total_duration_seconds: 0,
                      activity_count: 0,
                    }

                    const level = getIntensityLevel(data.total_duration_seconds)
                    const isSelected = selectedDate === day.dateStr
                    const isToday = day.dateStr === todayStr
                    const ariaLabel = getAriaLabel(
                      day.dateStr,
                      data.total_duration_seconds,
                      data.activity_count,
                      isToday,
                      isSelected
                    )

                    return (
                      <button
                        key={dIdx}
                        type="button"
                        aria-label={ariaLabel}
                        onClick={() => onSelectDate(day.dateStr)}
                        onMouseEnter={() =>
                          setHoveredData({
                            date: day.dateStr,
                            duration: data.total_duration_seconds,
                            count: data.activity_count,
                          })
                        }
                        onMouseLeave={() => setHoveredData(null)}
                        className={getCellClasses(level, isToday, isSelected)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Footer Legend */}
      <div className="mt-4 pt-3 border-t border-github-border/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-github-muted">
        <span className="hover:text-github-bright transition cursor-pointer">
          Telemetry aggregated by day
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded-[3px] bg-[#20262e] border border-[#303740]" title="0 min" />
              <div className="w-3.5 h-3.5 rounded-[3px] bg-[#164e32] border border-[#216b43]" title="1–29 min" />
              <div className="w-3.5 h-3.5 rounded-[3px] bg-[#167347] border border-[#238b56]" title="30–59 min" />
              <div className="w-3.5 h-3.5 rounded-[3px] bg-[#20a65a] border border-[#32bd6b]" title="60–119 min" />
              <div className="w-3.5 h-3.5 rounded-[3px] bg-[#39d56f] border border-[#55e889]" title="120+ min" />
            </div>
            <span>More</span>
          </div>

          <span className="text-github-border">|</span>

          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-[#20262e] border border-[#303740] ring-2 ring-strava shadow-[0_0_6px_rgba(252,82,0,0.5)]" title="Today Marker" />
            <span className="text-github-bright font-semibold">Today</span>
          </div>

          <span className="text-github-border">|</span>

          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-[#20262e] border-white ring-2 ring-white" title="Selected Marker" />
            <span className="text-github-bright font-semibold">Selected</span>
          </div>
        </div>
      </div>
    </div>
  )
}



