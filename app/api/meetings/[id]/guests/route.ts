import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const guestPayloadSchema = z.object({
  name: z.string().trim().min(1, "이름은 필수입니다.").max(50, "이름은 50자 이하여야 합니다."),
  phoneNumber: z
    .string()
    .trim()
    .max(30, "연락처는 30자 이하여야 합니다.")
    .optional()
    .transform((value) => (value ? value : undefined)),
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
      response: NextResponse.json({ error: "게스트 관리 권한이 없습니다" }, { status: 403 }),
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

  const parsed = guestPayloadSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const guest = await prisma.meetingGuest.create({
    data: {
      meetingId: id,
      ...parsed.data,
    },
  })

  return NextResponse.json(guest, { status: 201 })
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
  const guestId = searchParams.get("guestId")

  if (!guestId) {
    return NextResponse.json({ error: "guestId가 필요합니다" }, { status: 400 })
  }

  await prisma.meetingGuest.deleteMany({
    where: {
      id: guestId,
      meetingId: id,
    },
  })

  return NextResponse.json({ success: true })
}
