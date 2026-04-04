import { prisma } from "@/lib/prisma"
import { calculateDistanceInKm } from "@/lib/location"
import { MeetingFilter } from "./components/meetings/MeetingFilter"
import { MeetingSplitView } from "./components/meetings/MeetingSplitView"

export const dynamic = "force-dynamic"

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; lat?: string; lng?: string; radius?: string }
}) {
  const { category, search, lat, lng, radius } = await searchParams

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

  let meetings = await prisma.meeting.findMany({
    where,
    orderBy: { date: "asc" },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  })

  if (lat && lng && radius) {
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const radiusKm = parseFloat(radius)

    meetings = meetings
      .filter((meeting) => {
        const m = meeting as typeof meeting & { latitude?: number; longitude?: number }
        if (!m.latitude || !m.longitude) return false
        const distance = calculateDistanceInKm(
          { latitude: userLat, longitude: userLng },
          { latitude: m.latitude, longitude: m.longitude }
        )
        return distance <= radiusKm
      })
      .map((meeting) => {
        const m = meeting as typeof meeting & { latitude?: number; longitude?: number }
        return {
          ...meeting,
          distance: calculateDistanceInKm(
            { latitude: userLat, longitude: userLng },
            { latitude: m.latitude!, longitude: m.longitude! }
          ),
        }
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">모임 찾기</h1>
        <p className="text-muted-foreground mt-2">
          관심있는 모임을 찾고 참여핳세요.
        </p>
      </div>

      <MeetingFilter />
      <MeetingSplitView meetings={meetings} />
    </div>
  )
}
