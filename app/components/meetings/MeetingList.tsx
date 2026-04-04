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
  onMeetingClick?: (id: string) => void
  selectedId?: string | null
}

export function MeetingList({ meetings, onMeetingClick, selectedId }: MeetingListProps) {
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
    <div className="grid grid-cols-1 gap-4">
      {meetings.map((meeting) => (
        <div
          key={meeting.id}
          onClick={() => onMeetingClick?.(meeting.id)}
          className={`cursor-pointer transition-all ${
            selectedId === meeting.id
              ? "ring-2 ring-primary-600 rounded-lg"
              : ""
          }`}
        >
          <MeetingCard meeting={meeting} />
        </div>
      ))}
    </div>
  )
}
