import Link from "next/link"
import { Calendar, MapPin, Users, Navigation } from "lucide-react"
import { formatMeetingDateLong } from "@/lib/date-format"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/Card"
import { Button } from "../ui/Button"

interface MeetingCardProps {
  meeting: {
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
    distance?: number
  }
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const isFull = meeting._count?.participants === meeting.maxParticipants

  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {meeting.category}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Users className="w-4 h-4" />
            {meeting._count?.participants || 0} / {meeting.maxParticipants}
          </span>
        </div>
        <CardTitle className="line-clamp-1">{meeting.title}</CardTitle>
        <CardDescription className="line-clamp-2 h-10">
          {meeting.description || "설명이 없습니다."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatMeetingDateLong(meeting.date)}</span>
        </div>
        {meeting.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{meeting.location}</span>
          </div>
        )}
        {meeting.distance !== undefined && (
          <div className="flex items-center gap-2 text-primary-600">
            <Navigation className="w-4 h-4" />
            <span>
              {meeting.distance < 1
                ? `${Math.round(meeting.distance * 1000)}m`
                : `${meeting.distance.toFixed(1)}km`}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/meetings/${meeting.id}`} className="w-full">
          <Button variant={isFull ? "secondary" : "default"} className="w-full">
            {isFull ? "모집 마감" : "자세히 보기"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
