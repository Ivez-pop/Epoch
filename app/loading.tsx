import React from 'react'

export default function HomeLoading() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header & Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="h-10 w-64 bg-zinc-800/80 rounded-xl animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-10 w-28 bg-zinc-800/80 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Main Feed + Sidebar Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Feed Card Skeletons */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 w-44 bg-zinc-800 rounded" />
                <div className="h-4 w-20 bg-zinc-800/60 rounded" />
              </div>
              <div className="h-4 w-72 bg-zinc-800/40 rounded" />
              <div className="flex items-center gap-4 pt-2">
                <div className="h-4 w-24 bg-zinc-800/50 rounded" />
                <div className="h-4 w-28 bg-zinc-800/50 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Right: Sidebar Stats Skeleton */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5 space-y-4 animate-pulse">
            <div className="h-5 w-32 bg-zinc-800 rounded" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-zinc-800/60 rounded-xl" />
              <div className="h-16 bg-zinc-800/60 rounded-xl" />
              <div className="h-16 bg-zinc-800/60 rounded-xl" />
              <div className="h-16 bg-zinc-800/60 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
