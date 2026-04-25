export type AttendanceStatusValue = "PRESENT" | "LATE" | "ABSENT"
export type MeetingFeeStatusValue = "UNPAID" | "PAID" | "WAIVED"

export type AdminDashboardParticipant = {
  userId: string
  name: string | null
  email: string
}

export type AdminDashboardSummaryInput = {
  creatorId: string
  maxParticipants: number
  participants: AdminDashboardParticipant[]
  attendances: Array<{
    userId: string
    status: AttendanceStatusValue
  }>
  fees: Array<{
    userId: string
    status: MeetingFeeStatusValue
  }>
  guestCount: number
}

export function buildAdminDashboardSummary(input: AdminDashboardSummaryInput) {
  const operationalUsers = [
    { userId: input.creatorId, name: null, email: "모임장" },
    ...input.participants,
  ]
  const attendanceByUserId = new Map(
    input.attendances.map((attendance) => [attendance.userId, attendance.status])
  )
  const feeByUserId = new Map(input.fees.map((fee) => [fee.userId, fee.status]))
  const participantCount = operationalUsers.length
  const availableSlots = Math.max(input.maxParticipants - input.participants.length, 0)
  const occupancyRate =
    input.maxParticipants > 0
      ? Math.round((input.participants.length / input.maxParticipants) * 100)
      : 0

  const attendance = {
    present: countByStatus(input.attendances, "PRESENT"),
    late: countByStatus(input.attendances, "LATE"),
    absent: countByStatus(input.attendances, "ABSENT"),
    checked: input.attendances.length,
    unchecked: operationalUsers.filter((user) => !attendanceByUserId.has(user.userId)).length,
  }

  const fees = input.participants.reduce(
    (acc, participant) => {
      const status = feeByUserId.get(participant.userId)

      if (status === "PAID") {
        acc.paid += 1
      } else if (status === "WAIVED") {
        acc.waived += 1
      } else {
        acc.unpaid += 1
      }

      return acc
    },
    { paid: 0, unpaid: 0, waived: 0 }
  )

  const actionItems = input.participants
    .map((participant) => {
      const needsAttendance = !attendanceByUserId.has(participant.userId)
      const feeStatus = feeByUserId.get(participant.userId)
      const needsFee = feeStatus === undefined || feeStatus === "UNPAID"

      return {
        userId: participant.userId,
        displayName: participant.name || participant.email,
        needsAttendance,
        needsFee,
      }
    })
    .filter((item) => item.needsAttendance || item.needsFee)

  return {
    participantCount,
    joinedParticipantCount: input.participants.length,
    availableSlots,
    occupancyRate,
    attendance,
    fees,
    guestCount: input.guestCount,
    actionItems,
  }
}

function countByStatus(
  attendances: AdminDashboardSummaryInput["attendances"],
  status: AttendanceStatusValue
) {
  return attendances.filter((attendance) => attendance.status === status).length
}
