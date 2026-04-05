import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { calculateDistanceInKm } from "@/lib/location"
import { MeetingLayout } from "./components/meetings/MeetingLayout"

export const dynamic = "force-dynamic"

type MeetingListItem = Prisma.MeetingGetPayload<{
  include: {
    _count: {
      select: { participants: true }
    }
  }
}>

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    search?: string
    lat?: string
    lng?: string
    radius?: string
  }>
}) {
  const { category, search, lat, lng, radius } = await searchParams
  let errorMessage: string | undefined

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

  let meetings: MeetingListItem[] = []

  try {
    meetings = await prisma.meeting.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    })
  } catch (error) {
    console.error("Failed to load meetings", error)
    errorMessage = "모임 데이터를 불러오지 못했습니다. 데이터베이스 설정을 확인해주세요."
  }

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

  return <MeetingLayout meetings={meetings} errorMessage={errorMessage} />
}
