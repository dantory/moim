import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Calendar, ChevronLeft, UserPlus, Users } from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatMeetingDateLong } from "@/lib/date-format"
import { Button } from "@/app/components/ui/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/Card"
import { GuestManager } from "./GuestManager"

export default async function MeetingGuestsPage({
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
      guests: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          participants: true,
          guests: true,
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

  const guests = meeting.guests.map((guest) => ({
    id: guest.id,
    name: guest.name,
    phoneNumber: guest.phoneNumber,
    note: guest.note,
    createdAtLabel: `등록일 ${formatMeetingDateLong(guest.createdAt)}`,
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary-50 via-background to-background p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary-700">게스트 관리</p>
          <h1 className="text-3xl font-semibold tracking-tight">{meeting.title}</h1>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatMeetingDateLong(meeting.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>참여자 {meeting._count.participants}명</span>
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
          <Link href={`/meetings/${meeting.id}/attendance`}>
            <Button>출결 관리</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="등록 게스트" value={meeting._count.guests} />
        <SummaryCard label="참여자 + 게스트" value={meeting._count.participants + meeting._count.guests} />
        <SummaryCard label="운영 메모" value={guests.filter((guest) => guest.note).length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">게스트 등록 및 목록</CardTitle>
            <CardDescription>
              오늘 참석하는 게스트를 등록하고 운영 메모를 함께 남길 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuestManager meetingId={meeting.id} guests={guests} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">활용 포인트</CardTitle>
              <CardDescription>
                게스트 기록이 쌓이면 운영 판단이 쉬워집니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border p-4">
                반복 방문한 게스트를 정회원 후보로 추적하는 다음 단계의 기반 데이터가 됩니다.
              </div>
              <div className="rounded-xl border p-4">
                참여자가 적은 날 게스트 운영이 얼마나 많았는지 확인할 수 있습니다.
              </div>
              <div className="rounded-xl border p-4">
                차후 `Club/Event` 구조로 확장하면 같은 연락처 기준 누적 방문 이력으로 옮길 수 있습니다.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">빠른 이동</CardTitle>
              <CardDescription>
                운영자가 자주 오갈 다음 화면들입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink href={`/meetings/${meeting.id}/attendance`} label="출결 관리하기" />
              <QuickLink href={`/meetings/${meeting.id}/admin`} label="운영자 대시보드" />
              <QuickLink href={`/meetings/${meeting.id}`} label="모임 상세 보기" />
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

function QuickLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
    >
      <span className="font-medium">{label}</span>
      <UserPlus className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}
