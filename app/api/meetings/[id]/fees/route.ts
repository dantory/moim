import { NextResponse } from "next/server"
import { z } from "zod"
import { MeetingFeeStatus } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const feePayloadSchema = z.object({
  userId: z.string().min(1),
  status: z.nativeEnum(MeetingFeeStatus),
  note: z
    .string()
    .trim()
    .max(300, "메모는 300자 이하여야 합니다.")
    .optional()
    .transform((value) => (value ? value : undefined)),
})

async function ensureCreatorAccess(meetingId: string, userId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      creatorId: true,
      participants: {
        select: { userId: true },
      },
    },
  })

  if (!meeting) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "모임을 찾을 수 없습니다" }, { status: 404 }),
    }
  }

  if (meeting.creatorId !== userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "회비 관리 권한이 없습니다" }, { status: 403 }),
    }
  }

  return { ok: true as const, meeting }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
  }

  const access = await ensureCreatorAccess(id, session.user.id)
  if (!access.ok) {
    return access.response
  }

  const parsed = feePayloadSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const allowedUserIds = new Set(access.meeting.participants.map((participant) => participant.userId))
  if (!allowedUserIds.has(parsed.data.userId)) {
    return NextResponse.json(
      { error: "참여자만 회비 상태를 기록할 수 있습니다" },
      { status: 400 }
    )
  }

  const fee = await prisma.meetingFee.upsert({
    where: {
      meetingId_userId: {
        meetingId: id,
        userId: parsed.data.userId,
      },
    },
    update: {
      status: parsed.data.status,
      note: parsed.data.note,
      paidAt: parsed.data.status === MeetingFeeStatus.PAID ? new Date() : null,
    },
    create: {
      meetingId: id,
      userId: parsed.data.userId,
      status: parsed.data.status,
      note: parsed.data.note,
      paidAt: parsed.data.status === MeetingFeeStatus.PAID ? new Date() : null,
    },
  })

  return NextResponse.json(fee)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
  }

  const access = await ensureCreatorAccess(id, session.user.id)
  if (!access.ok) {
    return access.response
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId가 필요합니다" }, { status: 400 })
  }

  await prisma.meetingFee.deleteMany({
    where: {
      meetingId: id,
      userId,
    },
  })

  return NextResponse.json({ success: true })
}
