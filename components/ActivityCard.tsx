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

  const subjectColor = subject?.color || '#f97316'

  return (
    <Link
      href={`/activity/${id}`}
      className="group block relative rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-6 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/70 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {title ? (
            <h3 className="text-lg sm:text-[19px] font-semibold text-zinc-100 tracking-tight leading-snug group-hover:text-orange-400 transition-colors">
              {title}
            </h3>
          ) : (
            <span className="text-base font-medium text-zinc-400 italic group-hover:text-zinc-300 transition-colors">
              Untitled Activity
            </span>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          {subject ? (
            <div className="inline-flex items-center gap-2 text-sm text-zinc-300">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: subjectColor }}
              />
              <span className="font-medium">{subject.name}</span>
              <span className="text-zinc-600">·</span>
              <span className="font-mono text-orange-400 font-semibold">{formattedDuration}</span>
            </div>
          ) : (
            <span className="font-mono text-sm font-semibold text-orange-400">
              {formattedDuration}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p className="mt-3.5 text-[15px] text-zinc-300 leading-relaxed whitespace-pre-wrap line-clamp-3">
          {description}
        </p>
      )}

      <div className="mt-5 pt-4 border-t border-zinc-800/50 flex items-center justify-between text-sm text-zinc-400">
        <span>{formattedDate}</span>
        <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium text-sm flex items-center gap-1">
          View details &rarr;
        </span>
      </div>
    </Link>
  )
}
