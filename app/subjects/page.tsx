import { getSubjects } from '@/lib/subjects'
import { SubjectsFeed } from '@/components/SubjectsFeed'

export const revalidate = 0

export default async function SubjectsPage() {
  const subjects = await getSubjects()

  return (
    <div className="flex-1 flex flex-col justify-start">
      <SubjectsFeed initialSubjects={subjects} />
    </div>
  )
}
