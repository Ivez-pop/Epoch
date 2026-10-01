import React from 'react'

export default function HistoryLoading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
          <div>
            <div className="h-8 w-32 bg-zinc-800/80 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-zinc-800/40 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-zinc-800/80 rounded-xl animate-pulse" />
        </div>

        {/* Heatmap Container Skeleton */}
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-6 space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-zinc-800 rounded" />
          <div className="w-full h-32 bg-zinc-800/40 rounded-xl" />
        </div>

        {/* Year Summary Stats Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5 space-y-2 animate-pulse">
              <div className="h-4 w-20 bg-zinc-800/50 rounded" />
              <div className="h-6 w-16 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
