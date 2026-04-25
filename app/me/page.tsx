import Link from "next/link"
import { redirect } from "next/navigation"
import { Calendar, MapPin, Users, Plus, ArrowRight } from "lucide-react"

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

export default async function MyPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const [createdMeetings, joinedParticipations] = await Promise.all([
    prisma.meeting.findMany({
      where: { creatorId: session.user.id },
      orderBy: { date: "asc" },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    }),
    prisma.meetingParticipant.findMany({
      where: { userId: session.user.id },
      orderBy: {
        meeting: {
          date: "asc",
        },
      },
      include: {
        meeting: {
          include: {
            _count: {
              select: { participants: true },
            },
          },
        },
      },
    }),
  ])

  const joinedMeetings = joinedParticipations
    .map((participation) => participation.meeting)
    .filter((meeting) => meeting.creatorId !== session.user.id)

  const upcomingMeetings = [...createdMeetings, ...joinedMeetings]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary-50 via-background to-background p-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary-700">내 활동</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {session.user.name || session.user.email}님의 모임 현황
          </h1>
          <p className="text-sm text-muted-foreground">
            참여 중인 일정과 내가 운영하는 모임을 한 번에 확인할 수 있습니다.
          </p>
        </div>
        <Link href="/meetings/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 모임 만들기
          </Button>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="내가 만든 모임"
          value={createdMeetings.length}
          description="운영 중인 모임 수"
        />
        <SummaryCard
          label="참여 중인 모임"
          value={joinedMeetings.length}
          description="운영 외 참여 모임 수"
        />
        <SummaryCard
          label="가까운 예정 일정"
          value={upcomingMeetings.length}
          description="앞으로 예정된 상위 5개 일정"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-xl">예정된 일정</CardTitle>
              <CardDescription>
                내가 만들었거나 참여 중인 일정 중 가까운 순서로 보여줍니다.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="rounded-xl border bg-card p-4 transition-colors hover:border-primary-300"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-800">
                          {meeting.category}
                        </span>
                        {meeting.creatorId === session.user.id ? (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                            운영 중
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                            참여 중
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold">{meeting.title}</h2>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatMeetingDateLong(meeting.date)}</span>
                        </div>
                        {meeting.location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{meeting.location}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {meeting._count.participants} / {meeting.maxParticipants}명 참여
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {meeting.creatorId === session.user.id ? (
                        <Link href={`/meetings/${meeting.id}/admin`}>
                          <Button variant="outline" size="sm">
                            운영 보기
                          </Button>
                        </Link>
                      ) : null}
                      <Link href={`/meetings/${meeting.id}`}>
                        <Button size="sm">상세 보기</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="예정된 일정이 없습니다"
                description="새 모임을 만들거나 가까운 모임에 참여해보세요."
                href="/"
                action="모임 둘러보기"
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <ActivitySection
            title="내가 만든 모임"
            description="운영 중인 모임으로 바로 이동할 수 있습니다."
            emptyTitle="아직 만든 모임이 없습니다"
            emptyDescription="새 모임을 만들면 운영 대시보드로 이어집니다."
            emptyHref="/meetings/new"
            emptyAction="모임 만들기"
            items={createdMeetings.map((meeting) => ({
              id: meeting.id,
              title: meeting.title,
              subtitle: `${meeting._count.participants} / ${meeting.maxParticipants}명`,
              href: `/meetings/${meeting.id}/admin`,
            }))}
          />
          <ActivitySection
            title="참여 중인 모임"
            description="이미 참여한 모임으로 빠르게 이동할 수 있습니다."
            emptyTitle="참여 중인 모임이 없습니다"
            emptyDescription="홈에서 근처 모임을 찾아 참여해보세요."
            emptyHref="/"
            emptyAction="모임 찾기"
            items={joinedMeetings.map((meeting) => ({
              id: meeting.id,
              title: meeting.title,
              subtitle: meeting.location || "위치 정보 없음",
              href: `/meetings/${meeting.id}`,
            }))}
          />
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ActivitySection({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
  emptyHref,
  emptyAction,
}: {
  title: string
  description: string
  items: Array<{
    id: string
    title: string
    subtitle: string
    href: string
  }>
  emptyTitle: string
  emptyDescription: string
  emptyHref: string
  emptyAction: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))
        ) : (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            href={emptyHref}
            action={emptyAction}
          />
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string
  description: string
  href: string
  action: string
}) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Link href={href} className="mt-4 inline-flex">
        <Button variant="outline" size="sm">
          {action}
        </Button>
      </Link>
    </div>
  )
}
