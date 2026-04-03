import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { MeetingForm } from "@/app/components/meetings/MeetingForm"

export default async function NewMeetingPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <MeetingForm />
    </div>
  )
}
