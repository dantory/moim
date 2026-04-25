import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { calculateDistanceInKm } from "@/lib/location"
import { MEETING_CATEGORY_ALL } from "@/lib/meeting-schema"

export const meetingListInclude = {
  _count: {
    select: { participants: true },
  },
} satisfies Prisma.MeetingInclude

export const meetingDetailInclude = {
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
} satisfies Prisma.MeetingInclude

export function buildMeetingWhere(input: { category?: string; search?: string }) {
  return {
    ...(input.category && input.category !== MEETING_CATEGORY_ALL ? { category: input.category } : {}),
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search } },
            { description: { contains: input.search } },
          ],
        }
      : {}),
  } satisfies Prisma.MeetingWhereInput
}

export function withDistance<T extends { latitude: number | null; longitude: number | null }>(
  meetings: T[],
  params?: { lat?: number; lng?: number; radius?: number }
) {
  if (params?.lat === undefined || params.lng === undefined || params.radius === undefined) {
    return meetings
  }

  return meetings
    .filter((meeting) => {
      if (meeting.latitude == null || meeting.longitude == null) {
        return false
      }

      const distance = calculateDistanceInKm(
        { latitude: params.lat!, longitude: params.lng! },
        { latitude: meeting.latitude, longitude: meeting.longitude }
      )

      return distance <= params.radius!
    })
    .map((meeting) => ({
      ...meeting,
      distance: calculateDistanceInKm(
        { latitude: params.lat!, longitude: params.lng! },
        { latitude: meeting.latitude!, longitude: meeting.longitude! }
      ),
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
}

export async function listMeetings(params: {
  category?: string
  search?: string
  lat?: number
  lng?: number
  radius?: number
}) {
  const meetings = await prisma.meeting.findMany({
    where: buildMeetingWhere(params),
    orderBy: { date: "asc" },
    include: meetingListInclude,
  })

  return withDistance(meetings, params)
}
