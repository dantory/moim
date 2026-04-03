import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MeetingForm } from "@/app/components/meetings/MeetingForm"

export default async function EditMeetingPage({
  params,
}: {
  params: { id: string }
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

  return (
    <div className="max-w-2xl mx-auto">
      <MeetingForm initialData={meeting} isEditing />
    </div>
  )
}
