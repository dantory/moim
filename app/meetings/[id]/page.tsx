import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, MapPin, Users, User as UserIcon } from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/app/components/ui/Button"
import { JoinButton } from "./JoinButton"
import { DeleteButton } from "./DeleteButton"

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: { participants: true },
      },
    },
  })

  if (!meeting) {
    notFound()
  }

  const isCreator = session?.user?.id === meeting.creatorId
  const isParticipating = meeting.participants.some(
    (p) => p.userId === session?.user?.id
  )
  const isFull = meeting._count.participants >= meeting.maxParticipants

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            {meeting.category}
          </span>
          {isCreator && (
            <div className="flex gap-2">
              <Link href={`/meetings/${meeting.id}/admin`}>
                <Button variant="outline" size="sm">
                  운영보기
                </Button>
              </Link>
              <Link href={`/meetings/${meeting.id}/edit`}>
                <Button variant="outline" size="sm">
                  수정하기
                </Button>
              </Link>
              <DeleteButton meetingId={meeting.id} />
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold">{meeting.title}</h1>
        
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>{format(new Date(meeting.date), "PPP p", { locale: ko })}</span>
          </div>
          {meeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{meeting.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>
              {meeting._count.participants} / {meeting.maxParticipants}명
            </span>
          </div>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <h3 className="text-xl font-semibold mb-4">모임 설명</h3>
        <p className="whitespace-pre-wrap">
          {meeting.description || "설명이 없습니다."}
        </p>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-xl font-semibold mb-4">참여자 목록</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">
                {meeting.creator.name || meeting.creator.email}
              </p>
              <p className="text-xs text-muted-foreground">모임장</p>
            </div>
          </div>
          {meeting.participants
            .filter((p) => p.userId !== meeting.creatorId)
            .map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">
                    {participant.user.name || participant.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">참여자</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t sm:static sm:bg-transparent sm:border-t-0 sm:p-0">
        <div className="max-w-3xl mx-auto">
          <JoinButton
            meetingId={meeting.id}
            isParticipating={isParticipating}
            isFull={isFull}
            isCreator={isCreator}
            isAuthenticated={!!session}
          />
        </div>
      </div>
    </div>
  )
}
