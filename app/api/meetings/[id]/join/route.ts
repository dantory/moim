import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
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

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    if (meeting._count.participants >= meeting.maxParticipants) {
      return NextResponse.json(
        { error: "인원이 초과되었습니다" },
        { status: 400 }
      )
    }

    const existingParticipation = await prisma.meetingParticipant.findUnique({
      where: {
        meetingId_userId: {
          meetingId: id,
          userId: session.user.id,
        },
      },
    })

    if (existingParticipation) {
      return NextResponse.json(
        { error: "이미 참여 중입니다" },
        { status: 409 }
      )
    }

    const participation = await prisma.meetingParticipant.create({
      data: {
        meetingId: id,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(participation)
  } catch (error) {
    console.error("Failed to join meeting:", error)
    return NextResponse.json(
      { error: "모임 참여에 실패했습니다" },
      { status: 500 }
    )
  }
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

    const existingParticipation = await prisma.meetingParticipant.findUnique({
      where: {
        meetingId_userId: {
          meetingId: id,
          userId: session.user.id,
        },
      },
    })

    if (!existingParticipation) {
      return NextResponse.json(
        { error: "참여 중이 아닙니다" },
        { status: 404 }
      )
    }

    await prisma.meetingParticipant.delete({
      where: {
        meetingId_userId: {
          meetingId: id,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ message: "모임에서 탈퇴했습니다" })
  } catch (error) {
    console.error("Failed to leave meeting:", error)
    return NextResponse.json(
      { error: "모임 탈퇴에 실패했습니다" },
      { status: 500 }
    )
  }
}
