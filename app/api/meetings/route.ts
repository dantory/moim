import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  listMeetings,
  meetingDetailInclude,
} from "@/lib/meeting-service"
import { meetingCreateSchema, meetingQuerySchema } from "@/lib/meeting-schema"

export async function GET(req: Request) {
  try {
    const parsed = meetingQuerySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams.entries())
    )

    if (!parsed.success) {
      return NextResponse.json(
        { error: "검색 조건이 올바르지 않습니다", issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const meetings = await listMeetings(parsed.data)

    return NextResponse.json(meetings)
  } catch (error) {
    console.error("Failed to fetch meetings:", error)
    return NextResponse.json(
      { error: "모임 목록을 불러오는데 실패했습니다" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const rawBody = await req.json()
    const parsed = meetingCreateSchema.safeParse({
      ...rawBody,
      date: rawBody?.date ? new Date(rawBody.date) : rawBody?.date,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, category, maxParticipants, date, location, latitude, longitude } =
      parsed.data

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        category,
        maxParticipants: maxParticipants || 10,
        date: new Date(date),
        location,
        latitude,
        longitude,
        creatorId: session.user.id,
      },
      include: meetingDetailInclude,
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error("Failed to create meeting:", error)
    return NextResponse.json(
      { error: "모임 생성에 실패했습니다" },
      { status: 500 }
    )
  }
}
