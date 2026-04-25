import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Calendar, ChevronLeft, Users } from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatMeetingDateLong } from "@/lib/date-format"
import { getMeetingFeeStatusLabel } from "@/lib/meeting-fee"
import { Button } from "@/app/components/ui/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/Card"
import { FeeManager } from "./FeeManager"

export default async function MeetingFeesPage({
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
      fees: true,
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

  const feeByUserId = new Map(meeting.fees.map((fee) => [fee.userId, fee]))
  const members = meeting.participants.map((participant) => {
    const fee = feeByUserId.get(participant.user.id)

    return {
      userId: participant.user.id,
      name: participant.user.name || participant.user.email,
      email: participant.user.email,
      joinedLabel: `참여일 ${formatMeetingDateLong(participant.joinedAt)}`,
      status: fee?.status ?? null,
      note: fee?.note ?? null,
      paidAtLabel: fee?.paidAt ? `납부 처리 ${formatMeetingDateLong(fee.paidAt)}` : null,
    }
  })

  const summary = {
    total: members.length,
    paid: members.filter((member) => member.status === "PAID").length,
    unpaid: members.filter((member) => member.status === "UNPAID").length,
    waived: members.filter((member) => member.status === "WAIVED").length,
    unset: members.filter((member) => !member.status).length,
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary-50 via-background to-background p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary-700">회비 상태 관리</p>
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="납부 완료" value={summary.paid} />
        <SummaryCard label="미납" value={summary.unpaid} />
        <SummaryCard label="면제" value={summary.waived} />
        <SummaryCard label="미설정" value={summary.unset} />
        <SummaryCard label="대상 인원" value={summary.total} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">참여자별 회비 상태</CardTitle>
            <CardDescription>
              각 참여자의 납부 여부를 기록하고 운영 메모를 남길 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length > 0 ? (
              <FeeManager meetingId={meeting.id} members={members} />
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="font-medium">회비를 관리할 참여자가 없습니다</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  참여자가 생기면 회비 상태를 기록할 수 있습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">현재 요약</CardTitle>
              <CardDescription>
                회비 상태를 빠르게 훑어보는 용도입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.length > 0 ? (
                members.map((member) => (
                  <div key={member.userId} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {getMeetingFeeStatusLabel(member.status)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="font-medium">아직 요약할 참여자가 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">다음 단계</CardTitle>
              <CardDescription>
                회비 관리 이후 이어질 운영 확장입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border p-4">
                장기적으로는 `Meeting` 단위가 아니라 `Club` 월회비 기준으로 확장하는 것이 맞습니다.
              </div>
              <div className="rounded-xl border p-4">
                장부 기능이 붙으면 입금/출금 기록과 영수증까지 연결할 수 있습니다.
              </div>
              <div className="rounded-xl border p-4">
                출석률과 회비 상태를 같이 보면 관리가 필요한 회원을 더 쉽게 찾을 수 있습니다.
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
