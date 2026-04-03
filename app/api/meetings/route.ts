import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}

    if (category && category !== "all") {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const meetings = await prisma.meeting.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    })

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

    const body = await req.json()
    const { title, description, category, maxParticipants, date, location } = body

    if (!title || !category || !date) {
      return NextResponse.json(
        { error: "제목, 카테고리, 날짜는 필수입니다" },
        { status: 400 }
      )
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        category,
        maxParticipants: maxParticipants || 10,
        date: new Date(date),
        location,
        creatorId: session.user.id,
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

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error("Failed to create meeting:", error)
    return NextResponse.json(
      { error: "모임 생성에 실패했습니다" },
      { status: 500 }
    )
  }
}
