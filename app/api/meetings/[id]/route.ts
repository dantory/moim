import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { meetingDetailInclude } from "@/lib/meeting-service"
import { meetingUpdateSchema } from "@/lib/meeting-schema"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: meetingDetailInclude,
    })

    if (!meeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Failed to fetch meeting:", error)
    return NextResponse.json(
      { error: "모임 정보를 불러오는데 실패했습니다" },
      { status: 500 }
    )
  }
}

async function updateMeeting(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id },
    })

    if (!existingMeeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    if (existingMeeting.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "모임 수정 권한이 없습니다" },
        { status: 403 }
      )
    }

    const rawBody = await req.json()
    const parsed = meetingUpdateSchema.safeParse({
      ...rawBody,
      ...(rawBody?.date ? { date: new Date(rawBody.date) } : {}),
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, category, maxParticipants, date, location, latitude, longitude } =
      parsed.data

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(maxParticipants && { maxParticipants }),
        ...(date && { date: new Date(date) }),
        ...(location !== undefined && { location }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
      include: meetingDetailInclude,
    })

    return NextResponse.json(meeting)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다" },
        { status: 400 }
      )
    }
    console.error("Failed to update meeting:", error)
    return NextResponse.json(
      { error: "모임 수정에 실패했습니다" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateMeeting(req, context)
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateMeeting(req, context)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id },
    })

    if (!existingMeeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    if (existingMeeting.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "모임 삭제 권한이 없습니다" },
        { status: 403 }
      )
    }

    await prisma.meeting.delete({
      where: { id },
    })

    return NextResponse.json({ message: "모임이 삭제되었습니다" })
  } catch (error) {
    console.error("Failed to delete meeting:", error)
    return NextResponse.json(
      { error: "모임 삭제에 실패했습니다" },
      { status: 500 }
    )
  }
}
