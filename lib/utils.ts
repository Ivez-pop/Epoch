/**
 * Utility functions for formatting durations, timestamps, and dates.
 */

export function formatActivityDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  const now = new Date()

  // Reset hours/minutes/seconds for day comparison
  const dStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const nStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const diffDays = Math.round((nStart.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24))

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (diffDays === 0) {
    return `Today · ${timeStr}`
  } else if (diffDays === 1) {
    return `Yesterday · ${timeStr}`
  } else {
    const monthDay = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    if (date.getFullYear() === now.getFullYear()) {
      return `${monthDay} · ${timeStr}`
    }
    return `${monthDay}, ${date.getFullYear()} · ${timeStr}`
  }
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds <= 0) return '0s'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
  }
  if (mins > 0) {
    return `${mins}m`
  }
  return `${secs}s`
}

export function formatTimerDisplay(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export function formatTimeRange(startedAt: string, endedAt: string | null): string {
  if (!startedAt) return ''
  const start = new Date(startedAt)
  if (isNaN(start.getTime())) return ''

  const startTimeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (!endedAt) return startTimeStr

  const end = new Date(endedAt)
  if (isNaN(end.getTime())) return startTimeStr

  const endTimeStr = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return `${startTimeStr} → ${endTimeStr}`
}

export function formatFullDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
