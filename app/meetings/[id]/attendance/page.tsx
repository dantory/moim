import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Calendar, ChevronLeft, Users } from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatMeetingDateLong } from "@/lib/date-format"
import { getAttendanceStatusLabel } from "@/lib/attendance"
import { Button } from "@/app/components/ui/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/Card"
import { AttendanceManager } from "./AttendanceManager"

export default async function MeetingAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      participants: {
        orderBy: { joinedAt: "asc" },
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
      attendances: {
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
        select: {
          participants: true,
        },
      },
    },
  })

  if (!meeting) {
    notFound()
  }

  if (meeting.creatorId !== session.user.id) {
    redirect(`/meetings/${meeting.id}`)
  }

  const attendanceByUserId = new Map(
    meeting.attendances.map((attendance) => [attendance.userId, attendance])
  )

  const attendees = [
    {
      userId: meeting.creator.id,
      name: meeting.creator.name || meeting.creator.email,
      email: meeting.creator.email,
      roleLabel: "모임장",
      joinedLabel: "모임 생성자",
      status: attendanceByUserId.get(meeting.creator.id)?.status ?? null,
      note: attendanceByUserId.get(meeting.creator.id)?.note,
    },
    ...meeting.participants.map((participant) => ({
      userId: participant.user.id,
      name: participant.user.name || participant.user.email,
      email: participant.user.email,
      roleLabel: "참여자",
      joinedLabel: `참여일 ${formatMeetingDateLong(participant.joinedAt)}`,
      status: attendanceByUserId.get(participant.user.id)?.status ?? null,
      note: attendanceByUserId.get(participant.user.id)?.note,
    })),
  ]

  const summary = {
    total: attendees.length,
    present: attendees.filter((attendee) => attendee.status === "PRESENT").length,
    late: attendees.filter((attendee) => attendee.status === "LATE").length,
    absent: attendees.filter((attendee) => attendee.status === "ABSENT").length,
    unchecked: attendees.filter((attendee) => !attendee.status).length,
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary-50 via-background to-background p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary-700">출결 관리</p>
          <h1 className="text-3xl font-semibold tracking-tight">{meeting.title}</h1>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatMeetingDateLong(meeting.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>총 {attendees.length}명 대상</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/meetings/${meeting.id}/admin`}>
            <Button variant="outline">
              <ChevronLeft className="mr-1 h-4 w-4" />
              대시보드로
            </Button>
          </Link>
          <Link href={`/meetings/${meeting.id}`}>
            <Button>모임 상세</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="출석" value={summary.present} />
        <SummaryCard label="지각" value={summary.late} />
        <SummaryCard label="결석" value={summary.absent} />
        <SummaryCard label="미체크" value={summary.unchecked} />
        <SummaryCard label="대상 인원" value={summary.total} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">참여자별 출결 체크</CardTitle>
            <CardDescription>
              모임장과 참여자의 출결 상태를 바로 기록할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceManager meetingId={meeting.id} attendees={attendees} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">현재 요약</CardTitle>
              <CardDescription>
                출결 체크가 끝난 뒤 운영자가 빠르게 볼 수 있는 요약입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {attendees.map((attendee) => (
                <div key={attendee.userId} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{attendee.name}</p>
                      <p className="text-sm text-muted-foreground">{attendee.roleLabel}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {getAttendanceStatusLabel(attendee.status)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">다음 단계</CardTitle>
              <CardDescription>
                출결 이후 이어질 운영 기능입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border p-4">
                게스트 출결을 별도로 기록하는 흐름을 붙이면 오늘 참석 구조가 더 명확해집니다.
              </div>
              <div className="rounded-xl border p-4">
                월별 출석 통계를 붙이면 활동 회원과 휴식 회원을 구분하기 쉬워집니다.
              </div>
              <div className="rounded-xl border p-4">
                회비 상태와 출석률을 함께 보면 운영자가 관리 우선순위를 정하기 쉬워집니다.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
