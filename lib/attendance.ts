import { AttendanceStatus } from "@prisma/client"

export const attendanceStatusOptions = [
  {
    value: AttendanceStatus.PRESENT,
    label: "출석",
    className: "bg-primary-600 text-white hover:bg-primary-700",
  },
  {
    value: AttendanceStatus.LATE,
    label: "지각",
    className: "bg-amber-500 text-white hover:bg-amber-600",
  },
  {
    value: AttendanceStatus.ABSENT,
    label: "결석",
    className: "bg-zinc-700 text-white hover:bg-zinc-800",
  },
] as const

export function getAttendanceStatusLabel(status: AttendanceStatus | null | undefined) {
  if (!status) {
    return "미체크"
  }

  return attendanceStatusOptions.find((option) => option.value === status)?.label ?? status
}
