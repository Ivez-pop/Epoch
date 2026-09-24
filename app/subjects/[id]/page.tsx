import { notFound } from 'next/navigation'
import { getSubject, getSubjectActivities } from '@/lib/subjects'
import { SubjectDetailView } from '@/components/SubjectDetailView'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SubjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const subject = await getSubject(id)

  if (!subject) {
    // If not found in DB, construct fallback empty subject container for client-side localStorage sync if offline
    const fallbackSubject = {
      id,
      name: 'Subject',
      color: '#f97316',
      created_at: new Date().toISOString(),
      total_duration_seconds: 0,
      activity_count: 0,
    }
    return <SubjectDetailView initialSubject={fallbackSubject} initialActivities={[]} />
  }

  const activities = await getSubjectActivities(id)

  return (
    <div className="flex-1 flex flex-col justify-start">
      <SubjectDetailView initialSubject={subject} initialActivities={activities} />
    </div>
  )
}
