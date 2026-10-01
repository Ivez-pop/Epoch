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
    <header className="w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 sm:gap-7">
          <Link href="/" className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-pulse" />
            Epoch
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              Activity
            </Link>
            <Link
              href="/subjects"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith('/subjects')
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              Subjects
            </Link>
            <Link
              href="/history"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith('/history')
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              History
            </Link>
            <Link
              href="/profile"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith('/profile')
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              Profile
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/activity/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 h-11 text-sm font-medium text-white shadow-sm hover:bg-orange-500 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden min-[400px]:inline">Start Activity</span>
            <span className="inline min-[400px]:hidden">Start</span>
          </Link>

          <button
            type="button"
            onClick={() => signOut()}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            title="Sign out"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
