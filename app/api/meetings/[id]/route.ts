import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
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

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Failed to fetch meeting:", error)
    return NextResponse.json(
      { error: "모임 정보를 불러오는데 실패했습니다" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await req.json()
    const { title, description, category, maxParticipants, date, location } = body

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(maxParticipants && { maxParticipants }),
        ...(date && { date: new Date(date) }),
        ...(location !== undefined && { location }),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { participants: true },
        },
      },
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Failed to update meeting:", error)
    return NextResponse.json(
      { error: "모임 수정에 실패했습니다" },
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
