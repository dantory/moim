import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  Calendar,
  ClipboardCheck,
  CreditCard,
  MapPin,
  ShieldCheck,
  Users,
  UserPlus,
  ArrowRight,
} from "lucide-react"

import { auth } from "@/lib/auth"
import { buildAdminDashboardSummary } from "@/lib/admin-dashboard-summary"
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

export default async function MeetingAdminPage({
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
        orderBy: { joinedAt: "desc" },
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
      attendances: {
        select: {
          userId: true,
          status: true,
        },
      },
      guests: {
        select: {
          id: true,
        },
      },
      fees: {
        select: {
          userId: true,
          status: true,
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

  const dashboardSummary = buildAdminDashboardSummary({
    creatorId: meeting.creatorId,
    maxParticipants: meeting.maxParticipants,
    participants: meeting.participants.map((participant) => ({
      userId: participant.userId,
      name: participant.user.name,
      email: participant.user.email,
    })),
    attendances: meeting.attendances,
    fees: meeting.fees,
    guestCount: meeting.guests.length,
  })
  const actionItemByUserId = new Map(
    dashboardSummary.actionItems.map((item) => [item.userId, item])
  )

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary-50 via-background to-background p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary-700">운영자 대시보드</p>
          <h1 className="text-3xl font-semibold tracking-tight">{meeting.title}</h1>
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
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/meetings/${meeting.id}`}>
            <Button variant="outline">모임 상세</Button>
          </Link>
          <Link href={`/meetings/${meeting.id}/edit`}>
            <Button>모임 수정</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="현재 참여 인원"
          value={`${dashboardSummary.joinedParticipantCount}명`}
          description={`정원 ${meeting.maxParticipants}명 중 ${dashboardSummary.availableSlots}자리 남음`}
        />
        <MetricCard
          icon={ShieldCheck}
          label="운영 상태"
          value={dashboardSummary.availableSlots > 0 ? "모집 중" : "모집 마감"}
          description={`좌석 점유율 ${dashboardSummary.occupancyRate}%`}
        />
        <MetricCard
          icon={ClipboardCheck}
          label="출결 체크"
          value={`${dashboardSummary.attendance.checked}/${dashboardSummary.participantCount}명`}
          description={`미체크 ${dashboardSummary.attendance.unchecked} / 출석 ${dashboardSummary.attendance.present} / 지각 ${dashboardSummary.attendance.late} / 결석 ${dashboardSummary.attendance.absent}`}
        />
        <MetricCard
          icon={UserPlus}
          label="게스트 관리"
          value={`${dashboardSummary.guestCount}명`}
          description="오늘/이번 모임에 등록된 임시 게스트 수"
        />
        <MetricCard
          icon={CreditCard}
          label="회비 상태"
          value={`${dashboardSummary.fees.unpaid}명 미납`}
          description={`납부 ${dashboardSummary.fees.paid} / 미납 ${dashboardSummary.fees.unpaid} / 면제 ${dashboardSummary.fees.waived}`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">참여자 현황</CardTitle>
            <CardDescription>
              참여자별로 출결과 회비 조치가 필요한지 바로 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <StatusPill
                label="미체크 출결"
                value={`${dashboardSummary.attendance.unchecked}명`}
              />
              <StatusPill
                label="미납 회비"
                value={`${dashboardSummary.fees.unpaid}명`}
              />
              <StatusPill
                label="조치 대상"
                value={`${dashboardSummary.actionItems.length}명`}
              />
            </div>
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{meeting.creator.name || meeting.creator.email}</p>
                  <p className="text-sm text-muted-foreground">모임장</p>
                </div>
                <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-800">
                  Owner
                </span>
              </div>
            </div>
            {meeting.participants
              .filter((participant) => participant.userId !== meeting.creatorId)
              .map((participant) => {
                const actionItem = actionItemByUserId.get(participant.userId)

                return (
                  <div
                    key={participant.id}
                    className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {participant.user.name || participant.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        참여일 {formatMeetingDateLong(participant.joinedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {actionItem?.needsAttendance ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          출결 미체크
                        </span>
                      ) : null}
                      {actionItem?.needsFee ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                          회비 확인
                        </span>
                      ) : null}
                      {!actionItem ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          조치 없음
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            {dashboardSummary.joinedParticipantCount === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="font-medium">아직 참여자가 없습니다</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  모임 정보를 더 채우고 모집을 시작해보세요.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">지금 필요한 조치</CardTitle>
              <CardDescription>
                출결 미체크나 회비 확인이 필요한 참여자를 모았습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardSummary.actionItems.length > 0 ? (
                dashboardSummary.actionItems.slice(0, 6).map((item) => (
                  <ActionItem key={item.userId} item={item} />
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="font-medium">현재 조치할 참여자가 없습니다</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    출결과 회비 상태가 모두 정리되어 있습니다.
                  </p>
                </div>
              )}
              {dashboardSummary.actionItems.length > 6 ? (
                <p className="text-sm text-muted-foreground">
                  외 {dashboardSummary.actionItems.length - 6}명은 참여자 현황에서 확인할 수 있습니다.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">빠른 이동</CardTitle>
              <CardDescription>
                운영자가 자주 보게 될 화면 진입점입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink href={`/meetings/${meeting.id}/attendance`} label="출결 관리하기" />
              <QuickLink href={`/meetings/${meeting.id}/guests`} label="게스트 관리하기" />
              <QuickLink href={`/meetings/${meeting.id}/fees`} label="회비 상태 관리" />
              <QuickLink href={`/meetings/${meeting.id}`} label="모임 상세 보기" />
              <QuickLink href={`/meetings/${meeting.id}/edit`} label="모임 수정하기" />
              <QuickLink href="/me" label="내 활동으로 돌아가기" />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
          <Icon className="h-5 w-5" />
        </div>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function StatusPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  )
}

function ActionItem({
  item,
}: {
  item: {
    displayName: string
    needsAttendance: boolean
    needsFee: boolean
  }
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-medium">{item.displayName}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.needsAttendance ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            출결 체크 필요
          </span>
        ) : null}
        {item.needsFee ? (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
            회비 확인 필요
          </span>
        ) : null}
      </div>
    </div>
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
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}
