import { getActivities } from '@/lib/activities'
import { ActivityFeed } from '@/components/ActivityFeed'

export const revalidate = 0

export default async function HomePage() {
  const activities = await getActivities()

  return (
    <div className="flex-1 flex flex-col justify-start">
      <ActivityFeed initialActivities={activities} />
    </div>
  )
}
