import { notFound } from 'next/navigation'
import { getActivity } from '@/lib/activities'
import { ActivityDetailView } from '@/components/ActivityDetailView'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params
  const activity = await getActivity(id)

  if (!activity) {
    // If not found in server DB, provide initial object for client-side localStorage lookup
    const fallbackActivity = {
      id,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: 0,
      title: '',
      description: null,
      subject_id: null,
      subject: null,
      created_at: new Date().toISOString(),
    }
    return <ActivityDetailView initialActivity={fallbackActivity} />
  }

  return (
    <div className="flex-1 flex flex-col justify-start">
      <ActivityDetailView initialActivity={activity} />
    </div>
  )
}
