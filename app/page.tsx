import { prisma } from "@/lib/prisma"
import { MeetingList } from "./components/meetings/MeetingList"
import { MeetingFilter } from "./components/meetings/MeetingFilter"

export const dynamic = "force-dynamic"

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string }
}) {
  const { category, search } = await searchParams

  const where = {
    ...(category && category !== "전체" ? { category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  }

  const meetings = await prisma.meeting.findMany({
    where,
    orderBy: { date: "asc" },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">모임 찾기</h1>
        <p className="text-muted-foreground mt-2">
          관심있는 모임을 찾고 참여해보세요.
        </p>
      </div>

      <MeetingFilter />
      <MeetingList meetings={meetings} />
    </div>
  )
}
