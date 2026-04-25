import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MeetingForm } from "@/app/components/meetings/MeetingForm"
import { MEETING_CATEGORIES } from "@/lib/meeting-schema"

export default async function EditMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  if (!session) {
    redirect("/auth/signin")
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id },
  })

  if (!meeting) {
    notFound()
  }

  if (meeting.creatorId !== session.user?.id) {
    redirect(`/meetings/${id}`)
  }

  const initialData = {
    ...meeting,
    category: MEETING_CATEGORIES.includes(meeting.category as (typeof MEETING_CATEGORIES)[number])
      ? (meeting.category as (typeof MEETING_CATEGORIES)[number])
      : MEETING_CATEGORIES[0],
  }

  return (
    <div className="max-w-2xl mx-auto">
      <MeetingForm initialData={initialData} isEditing />
    </div>
  )
}
