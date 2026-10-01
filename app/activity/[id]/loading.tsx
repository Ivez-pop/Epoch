import React from 'react'

export default function ActivityDetailLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-6 sm:p-8 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-zinc-800/60 rounded" />
          <div className="h-6 w-20 bg-zinc-800/80 rounded-full" />
        </div>
        <div className="h-8 w-64 bg-zinc-800 rounded" />
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800/60">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-zinc-800/50 rounded" />
            <div className="h-6 w-24 bg-zinc-800 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-zinc-800/50 rounded" />
            <div className="h-6 w-24 bg-zinc-800 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-zinc-800/50 rounded" />
            <div className="h-6 w-24 bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
