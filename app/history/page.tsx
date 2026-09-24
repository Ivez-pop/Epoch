import { getActivityHistory, getYearActivitySummary, getActivitiesForDate } from '@/lib/history'
import { HistoryView } from '@/components/HistoryView'

export const revalidate = 0

export default async function HistoryPage() {
  const currentYear = new Date().getFullYear()

  const historyMap = await getActivityHistory(currentYear)
  const summary = await getYearActivitySummary(currentYear)

  // Find latest active date in current year
  const activeDates = Object.keys(historyMap).filter(
    (dateKey) => historyMap[dateKey].activity_count > 0
  )
  activeDates.sort()
  const initialSelectedDate = activeDates.length > 0 ? activeDates[activeDates.length - 1] : null

  const initialDateActivities = initialSelectedDate
    ? await getActivitiesForDate(initialSelectedDate)
    : []

  return (
    <div className="flex-1 flex flex-col justify-start">
      <HistoryView
        initialYear={currentYear}
        initialHistoryMap={historyMap}
        initialSummary={summary}
        initialSelectedDate={initialSelectedDate}
        initialDateActivities={initialDateActivities}
      />
    </div>
  )
}
