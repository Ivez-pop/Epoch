'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth'

export function Header() {
  const pathname = usePathname()

  // Hide header on login, signup, or timer page
  if (pathname === '/activity/new' || pathname === '/login' || pathname === '/signup') {
    return null
  }

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
              Activity
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
            <Link
              href="/profile"
              className={`px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium transition-colors ${
                pathname.startsWith('/profile')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Profile
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/activity/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 sm:px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden min-[380px]:inline">Start Activity</span>
            <span className="inline min-[380px]:hidden">Start</span>
          </Link>

          <button
            type="button"
            onClick={() => signOut()}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
