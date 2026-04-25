import { MeetingFeeStatus } from "@prisma/client"

export const meetingFeeStatusOptions = [
  {
    value: MeetingFeeStatus.PAID,
    label: "납부 완료",
    className: "bg-primary-600 text-white hover:bg-primary-700",
  },
  {
    value: MeetingFeeStatus.UNPAID,
    label: "미납",
    className: "bg-rose-600 text-white hover:bg-rose-700",
  },
  {
    value: MeetingFeeStatus.WAIVED,
    label: "면제",
    className: "bg-zinc-700 text-white hover:bg-zinc-800",
  },
] as const

export function getMeetingFeeStatusLabel(status: MeetingFeeStatus | null | undefined) {
  if (!status) {
    return "미설정"
  }

  return meetingFeeStatusOptions.find((option) => option.value === status)?.label ?? status
}
