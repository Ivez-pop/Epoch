import React from 'react'

export default function SubjectDetailLoading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
          <div className="space-y-3">
            <div className="h-4 w-24 bg-zinc-800/60 rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-zinc-800 shrink-0 animate-pulse" />
              <div className="h-8 w-48 bg-zinc-800/80 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-24 bg-zinc-800/80 rounded-xl animate-pulse" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5 space-y-2 animate-pulse">
            <div className="h-4 w-20 bg-zinc-800/50 rounded" />
            <div className="h-7 w-28 bg-zinc-800 rounded" />
          </div>
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5 space-y-2 animate-pulse">
            <div className="h-4 w-24 bg-zinc-800/50 rounded" />
            <div className="h-7 w-16 bg-zinc-800 rounded" />
          </div>
        </div>

        {/* Activities List Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-zinc-800/60 rounded animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-zinc-800 rounded" />
                <div className="h-4 w-20 bg-zinc-800/60 rounded" />
              </div>
              <div className="h-4 w-64 bg-zinc-800/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
