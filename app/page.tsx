import { MeetingLayout } from "./components/meetings/MeetingLayout"
import { listMeetings } from "@/lib/meeting-service"
import { meetingQuerySchema } from "@/lib/meeting-schema"

export const dynamic = "force-dynamic"

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
  const parsed = meetingQuerySchema.safeParse(await searchParams)
  let errorMessage: string | undefined
  let meetings: Awaited<ReturnType<typeof listMeetings>> = []

  try {
    if (!parsed.success) {
      errorMessage = "검색 조건이 올바르지 않아 기본 목록을 표시합니다."
      meetings = await listMeetings({})
    } else {
      meetings = await listMeetings(parsed.data)
    }
  } catch (error) {
    console.error("Failed to load meetings", error)
    errorMessage = "모임 데이터를 불러오지 못했습니다. 데이터베이스 설정을 확인해주세요."
  }

  return <MeetingLayout meetings={meetings} errorMessage={errorMessage} />
}
