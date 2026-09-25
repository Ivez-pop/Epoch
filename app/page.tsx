import { getRecentActivities } from '@/lib/activities'
import { ActivityFeed } from '@/components/ActivityFeed'

export const revalidate = 0

export default async function HomePage() {
  const { activities, nextCursor, hasMore } = await getRecentActivities(20, null)

  return (
    <div className="flex-1 flex flex-col justify-start">
      <ActivityFeed
        initialActivities={activities}
        initialNextCursor={nextCursor}
        initialHasMore={hasMore}
      />
    </div>
  )
}
