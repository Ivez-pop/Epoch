import React from 'react'
import Link from 'next/link'
import { Activity } from '@/lib/supabase'
import { formatActivityDate, formatDuration } from '@/lib/utils'

interface ActivityCardProps {
  activity: Activity
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const { id, title, description, duration_seconds, started_at, subject } = activity
  const formattedDate = formatActivityDate(started_at)
  const formattedDuration = formatDuration(duration_seconds)
  const subjectColor = subject?.color || '#FC5200'

  return (
    <Link
      href={`/activity/${id}`}
      className="block p-4 bg-github-canvas rounded-lg border border-github-border hover:border-github-muted/50 transition group"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: subjectColor }}
          />
          <span className="text-xs font-mono font-bold truncate" style={{ color: subjectColor }}>
            {subject?.name || 'General'}
          </span>
          <span className="text-xs text-github-muted truncate">• {formattedDate}</span>
        </div>
        <span className="font-mono text-xs font-bold bg-github-subtle border border-github-border px-2 py-0.5 rounded text-github-bright shrink-0">
          ⚡ {formattedDuration}
        </span>
      </div>

      <h4 className="text-sm font-bold text-github-bright mt-2 group-hover:text-strava transition-colors">
        {title || 'Untitled Activity'}
      </h4>

      {description && (
        <p className="text-xs text-github-muted mt-1 leading-relaxed line-clamp-2 whitespace-pre-wrap">
          {description}
        </p>
      )}
    </Link>
  )
}

