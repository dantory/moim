"use client"

import { useState, useTransition } from "react"
import { AttendanceStatus } from "@prisma/client"
import { RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/app/components/ui/Button"
import { attendanceStatusOptions, getAttendanceStatusLabel } from "@/lib/attendance"

interface AttendanceManagerProps {
  meetingId: string
  attendees: Array<{
    userId: string
    name: string
    email: string
    roleLabel: string
    joinedLabel: string
    status: AttendanceStatus | null
    note?: string | null
  }>
}

export function AttendanceManager({ meetingId, attendees }: AttendanceManagerProps) {
  const router = useRouter()
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateAttendance = async (userId: string, status: AttendanceStatus) => {
    setPendingUserId(userId)

    try {
      const response = await fetch(`/api/meetings/${meetingId}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, status }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "출결 저장에 실패했습니다.")
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : "출결 저장 중 오류가 발생했습니다.")
    } finally {
      setPendingUserId(null)
    }
  }

  const resetAttendance = async (userId: string) => {
    setPendingUserId(userId)

    try {
      const response = await fetch(
        `/api/meetings/${meetingId}/attendance?userId=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "출결 초기화에 실패했습니다.")
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : "출결 초기화 중 오류가 발생했습니다.")
    } finally {
      setPendingUserId(null)
    }
  }

  return (
    <div className="space-y-3">
      {attendees.map((attendee) => {
        const disabled = pendingUserId === attendee.userId || isPending

        return (
          <div key={attendee.userId} className="rounded-xl border p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{attendee.name}</p>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {attendee.roleLabel}
                  </span>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-700">
                    {getAttendanceStatusLabel(attendee.status)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{attendee.email}</p>
                <p className="text-sm text-muted-foreground">{attendee.joinedLabel}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {attendanceStatusOptions.map((option) => {
                  const selected = attendee.status === option.value

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      className={selected ? option.className : undefined}
                      disabled={disabled}
                      onClick={() => updateAttendance(attendee.userId, option.value)}
                    >
                      {option.label}
                    </Button>
                  )
                })}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled || !attendee.status}
                  onClick={() => resetAttendance(attendee.userId)}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  초기화
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
