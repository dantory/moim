import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function createParticipationWithCapacityCheck(meetingId: string, userId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const meeting = await tx.meeting.findUnique({
            where: { id: meetingId },
            select: {
              id: true,
              maxParticipants: true,
              creatorId: true,
            },
          })

          if (!meeting) {
            return { status: 404 as const, body: { error: "모임을 찾을 수 없습니다" } }
          }

          if (meeting.creatorId === userId) {
            return { status: 400 as const, body: { error: "모임장은 자신의 모임에 참여할 수 없습니다" } }
          }

          const existingParticipation = await tx.meetingParticipant.findUnique({
            where: {
              meetingId_userId: {
                meetingId,
                userId,
              },
            },
          })

          if (existingParticipation) {
            return { status: 409 as const, body: { error: "이미 참여 중입니다" } }
          }

          const participantCount = await tx.meetingParticipant.count({
            where: { meetingId },
          })

          if (participantCount >= meeting.maxParticipants) {
            return { status: 400 as const, body: { error: "인원이 초과되었습니다" } }
          }

          const participation = await tx.meetingParticipant.create({
            data: {
              meetingId,
              userId,
            },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          })

          return { status: 200 as const, body: participation }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      ) {
        continue
      }

      throw error
    }
  }

  throw new Error("참여 처리 중 충돌이 반복되었습니다.")
}

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

    const result = await createParticipationWithCapacityCheck(id, session.user.id)
    return NextResponse.json(result.body, { status: result.status })
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
