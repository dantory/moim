import test from "node:test"
import assert from "node:assert/strict"

import { buildAdminDashboardSummary } from "../lib/admin-dashboard-summary"

test("buildAdminDashboardSummary counts unchecked attendance, unpaid fees, guests, and action items", () => {
  const summary = buildAdminDashboardSummary({
    creatorId: "owner",
    maxParticipants: 4,
    participants: [
      { userId: "member-paid", name: "Paid Member", email: "paid@example.com" },
      { userId: "member-unpaid", name: null, email: "unpaid@example.com" },
      { userId: "member-empty", name: "Empty Member", email: "empty@example.com" },
    ],
    attendances: [
      { userId: "owner", status: "PRESENT" },
      { userId: "member-paid", status: "LATE" },
    ],
    fees: [
      { userId: "member-paid", status: "PAID" },
      { userId: "member-unpaid", status: "UNPAID" },
    ],
    guestCount: 2,
  })

  assert.equal(summary.participantCount, 4)
  assert.equal(summary.availableSlots, 1)
  assert.equal(summary.attendance.checked, 2)
  assert.equal(summary.attendance.unchecked, 2)
  assert.equal(summary.fees.paid, 1)
  assert.equal(summary.fees.unpaid, 2)
  assert.equal(summary.guestCount, 2)
  assert.deepEqual(
    summary.actionItems.map((item) => ({
      userId: item.userId,
      displayName: item.displayName,
      needsAttendance: item.needsAttendance,
      needsFee: item.needsFee,
    })),
    [
      {
        userId: "member-unpaid",
        displayName: "unpaid@example.com",
        needsAttendance: true,
        needsFee: true,
      },
      {
        userId: "member-empty",
        displayName: "Empty Member",
        needsAttendance: true,
        needsFee: true,
      },
    ]
  )
})
