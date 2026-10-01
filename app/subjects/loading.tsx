import React from 'react'

export default function SubjectsLoading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
          <div>
            <div className="h-8 w-36 bg-zinc-800/80 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-zinc-800/40 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-zinc-800/80 rounded-xl animate-pulse" />
        </div>

        {/* Subjects Card Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5 sm:p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 shrink-0" />
                  <div className="h-5 w-32 bg-zinc-800 rounded" />
                </div>
                <div className="h-5 w-16 bg-zinc-800/60 rounded-full" />
              </div>
              <div className="h-4 w-24 bg-zinc-800/40 rounded" />
              <div className="w-full h-1.5 bg-zinc-800/60 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
