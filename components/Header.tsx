'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()

  // Hide global header on the active timer / new activity page
  if (pathname === '/activity/new') return null

  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-xl mx-auto px-3.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="text-base sm:text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-pulse" />
            Epoch
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link
              href="/"
              className={`px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Feed
            </Link>
            <Link
              href="/subjects"
              className={`px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium transition-colors ${
                pathname.startsWith('/subjects')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Subjects
            </Link>
            <Link
              href="/history"
              className={`px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium transition-colors ${
                pathname.startsWith('/history')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              History
            </Link>
          </nav>
        </div>

        <Link
          href="/activity/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 sm:px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden min-[360px]:inline">Start Activity</span>
          <span className="inline min-[360px]:hidden">Start</span>
        </Link>
      </div>
    </header>
  )
}
