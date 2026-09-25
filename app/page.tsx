import { searchActivities } from '@/lib/activities'
import { getSubjects } from '@/lib/subjects'
import { ActivityFeed } from '@/components/ActivityFeed'

export const revalidate = 0

interface HomePageProps {
  searchParams: Promise<{
    q?: string
    subject?: string
    from?: string
    to?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const q = params.q || ''
  const subjectId = params.subject || ''
  const from = params.from || ''
  const to = params.to || ''

  const [searchRes, subjects] = await Promise.all([
    searchActivities({
      query: q,
      subjectId,
      from,
      to,
      limit: 20,
    }),
    getSubjects(),
  ])

  return (
    <div className="flex-1 flex flex-col justify-start">
      <ActivityFeed
        initialActivities={searchRes.activities}
        initialNextCursor={searchRes.nextCursor}
        initialHasMore={searchRes.hasMore}
        initialTotalCount={searchRes.totalCount}
        subjects={subjects}
        currentFilters={{ q, subject: subjectId, from, to }}
      />
    </div>
  )
}
