import Link from 'next/link'

export default function ActivityNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-2">
        Activity not found
      </h1>

      <p className="text-sm text-zinc-400 mb-8 max-w-sm">
        The activity you are looking for does not exist or may have been deleted.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 transition-colors shadow-sm"
      >
        &larr; Back to Activity Feed
      </Link>
    </div>
  )
}
