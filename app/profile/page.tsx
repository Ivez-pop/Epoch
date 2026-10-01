import { getProfile, getProfileStats } from '@/lib/profile'
import { ProfileView } from '@/components/ProfileView'

export const revalidate = 0

export default async function ProfilePage() {
  const [{ profile, userEmail, createdAt, displayName }, stats] = await Promise.all([
    getProfile(),
    getProfileStats(),
  ])

  return (
    <div className="flex-1 flex flex-col justify-start">
      <ProfileView
        profile={profile}
        userEmail={userEmail}
        createdAt={createdAt}
        displayName={displayName}
        stats={stats}
      />
    </div>
  )
}
