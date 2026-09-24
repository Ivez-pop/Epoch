import React from 'react'
import Link from 'next/link'
import { Activity } from '@/lib/supabase'
import { formatActivityDate, formatDuration } from '@/lib/utils'

interface ActivityCardProps {
  activity: Activity
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const { title, description, duration_seconds, started_at, subject } = activity
  const formattedDate = formatActivityDate(started_at)
  const formattedDuration = formatDuration(duration_seconds)

  const subjectColor = subject?.color || '#f97316'

  return (
    <div className="group relative rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/90">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {title ? (
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight leading-snug">
              {title}
            </h3>
          ) : (
            <span className="text-sm font-medium text-zinc-400 italic">
              Untitled Activity
            </span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {subject ? (
            <Link
              href={`/subjects/${subject.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800/90 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors border border-zinc-700/60"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: subjectColor }}
              />
              <span>{subject.name}</span>
              <span className="text-zinc-500 font-mono">·</span>
              <span className="font-mono text-orange-400 font-semibold">{formattedDuration}</span>
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-orange-400 ring-1 ring-inset ring-orange-500/20">
              {formattedDuration}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p className="mt-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
      )}

      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
        <span>{formattedDate}</span>
      </div>
    </div>
  )
}
