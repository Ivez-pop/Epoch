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

  const isNavActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <header className="border-b border-github-border bg-[#0d1117]/90 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Global Nav */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link className="flex items-center gap-2.5 group focus:outline-none" href="/">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-strava to-orange-400 flex items-center justify-center shadow-lg shadow-strava/20 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-github-bright">
              EPOCH<span className="text-strava text-sm ml-1 font-mono tracking-normal">TEL</span>
            </span>
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3.5 py-1.5 text-sm transition ${
                isNavActive('/')
                  ? 'font-semibold rounded-md text-github-bright bg-github-subtle border border-github-border/70 flex items-center gap-2'
                  : 'font-medium rounded-md text-github-muted hover:text-github-bright hover:bg-github-subtle/50'
              }`}
            >
              {isNavActive('/') && <span className="w-2 h-2 rounded-full bg-strava animate-pulse" />}
              Telemetry
            </Link>

            <Link
              href="/subjects"
              className={`px-3.5 py-1.5 text-sm transition ${
                isNavActive('/subjects')
                  ? 'font-semibold rounded-md text-github-bright bg-github-subtle border border-github-border/70 flex items-center gap-2'
                  : 'font-medium rounded-md text-github-muted hover:text-github-bright hover:bg-github-subtle/50'
              }`}
            >
              {isNavActive('/subjects') && <span className="w-2 h-2 rounded-full bg-strava animate-pulse" />}
              Subjects
            </Link>

            <Link
              href="/history"
              className={`px-3.5 py-1.5 text-sm transition ${
                isNavActive('/history')
                  ? 'font-semibold rounded-md text-github-bright bg-github-subtle border border-github-border/70 flex items-center gap-2'
                  : 'font-medium rounded-md text-github-muted hover:text-github-bright hover:bg-github-subtle/50'
              }`}
            >
              {isNavActive('/history') && <span className="w-2 h-2 rounded-full bg-strava animate-pulse" />}
              History
            </Link>

            <Link
              href="/profile"
              className={`px-3.5 py-1.5 text-sm transition ${
                isNavActive('/profile')
                  ? 'font-semibold rounded-md text-github-bright bg-github-subtle border border-github-border/70 flex items-center gap-2'
                  : 'font-medium rounded-md text-github-muted hover:text-github-bright hover:bg-github-subtle/50'
              }`}
            >
              {isNavActive('/profile') && <span className="w-2 h-2 rounded-full bg-strava animate-pulse" />}
              Profile
            </Link>
          </nav>
        </div>

        {/* Quick Metrics & Global Action Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/activity/new"
            id="btn-start-activity"
            className="inline-flex items-center gap-2 bg-strava hover:bg-strava-hover text-white px-3.5 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-strava/25 transition transform active:scale-95"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Start Activity</span>
            <kbd className="hidden lg:inline-block ml-1.5 text-[10px] font-mono bg-black/25 px-1.5 py-0.5 rounded text-white/80">
              Space
            </kbd>
          </Link>

          <button
            type="button"
            onClick={() => signOut()}
            className="p-2 rounded-lg text-github-muted hover:text-github-bright hover:bg-github-subtle transition"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-github-border/60 bg-[#0d1117] px-2 py-1.5 text-xs font-mono">
        <Link
          href="/"
          className={`px-2.5 py-1 rounded ${
            isNavActive('/') ? 'text-github-bright bg-github-subtle font-bold' : 'text-github-muted'
          }`}
        >
          Telemetry
        </Link>
        <Link
          href="/subjects"
          className={`px-2.5 py-1 rounded ${
            isNavActive('/subjects') ? 'text-github-bright bg-github-subtle font-bold' : 'text-github-muted'
          }`}
        >
          Subjects
        </Link>
        <Link
          href="/history"
          className={`px-2.5 py-1 rounded ${
            isNavActive('/history') ? 'text-github-bright bg-github-subtle font-bold' : 'text-github-muted'
          }`}
        >
          History
        </Link>
        <Link
          href="/profile"
          className={`px-2.5 py-1 rounded ${
            isNavActive('/profile') ? 'text-github-bright bg-github-subtle font-bold' : 'text-github-muted'
          }`}
        >
          Profile
        </Link>
      </div>
    </header>
  )
}

