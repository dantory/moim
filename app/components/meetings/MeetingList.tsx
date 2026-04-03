import { MeetingCard } from "./MeetingCard"

interface MeetingListProps {
  meetings: {
    id: string
    title: string
    description: string | null
    category: string
    date: string | Date
    location: string | null
    maxParticipants: number
    _count?: {
      participants: number
    }
  }[]
}

export function MeetingList({ meetings }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium">모임이 없습니다</h3>
        <p className="text-sm text-muted-foreground mt-1">
          새로운 모임을 만들어보세요!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  )
}
