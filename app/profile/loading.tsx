import React from 'react'

export default function ProfileLoading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Profile Card Header Skeleton */}
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-6 sm:p-8 space-y-6 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-zinc-800 shrink-0" />
            <div className="space-y-2">
              <div className="h-7 w-48 bg-zinc-800 rounded" />
              <div className="h-4 w-36 bg-zinc-800/50 rounded" />
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5 space-y-2 animate-pulse">
              <div className="h-4 w-24 bg-zinc-800/50 rounded" />
              <div className="h-6 w-20 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
