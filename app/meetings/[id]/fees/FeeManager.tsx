"use client"

import { useState, useTransition } from "react"
import { RotateCcw } from "lucide-react"
import { MeetingFeeStatus } from "@prisma/client"
import { useRouter } from "next/navigation"

import { Button } from "@/app/components/ui/Button"
import { Input } from "@/app/components/ui/Input"
import { getMeetingFeeStatusLabel, meetingFeeStatusOptions } from "@/lib/meeting-fee"

interface FeeManagerProps {
  meetingId: string
  members: Array<{
    userId: string
    name: string
    email: string
    joinedLabel: string
    status: MeetingFeeStatus | null
    note: string | null
    paidAtLabel: string | null
  }>
}

export function FeeManager({ meetingId, members }: FeeManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(members.map((member) => [member.userId, member.note ?? ""]))
  )

  const refresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const updateFee = async (userId: string, status: MeetingFeeStatus) => {
    setPendingUserId(userId)

    try {
      const response = await fetch(`/api/meetings/${meetingId}/fees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status,
          note: notes[userId],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "회비 상태 저장에 실패했습니다.")
      }

      refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "회비 상태 저장 중 오류가 발생했습니다.")
    } finally {
      setPendingUserId(null)
    }
  }

  const resetFee = async (userId: string) => {
    setPendingUserId(userId)

    try {
      const response = await fetch(`/api/meetings/${meetingId}/fees?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "회비 상태 초기화에 실패했습니다.")
      }

      refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "회비 상태 초기화 중 오류가 발생했습니다.")
    } finally {
      setPendingUserId(null)
    }
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const disabled = isPending || pendingUserId === member.userId

        return (
          <div key={member.userId} className="rounded-xl border p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{member.name}</p>
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-700">
                      {getMeetingFeeStatusLabel(member.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="text-sm text-muted-foreground">{member.joinedLabel}</p>
                  {member.paidAtLabel ? (
                    <p className="text-sm text-muted-foreground">{member.paidAtLabel}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {meetingFeeStatusOptions.map((option) => {
                    const selected = member.status === option.value

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        className={selected ? option.className : undefined}
                        disabled={disabled}
                        onClick={() => updateFee(member.userId, option.value)}
                      >
                        {option.label}
                      </Button>
                    )
                  })}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={disabled || !member.status}
                    onClick={() => resetFee(member.userId)}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    초기화
                  </Button>
                </div>
              </div>

              <Input
                placeholder="메모 예시: 현장납부, 다음 주 입금 예정, 운영진 면제"
                value={notes[member.userId] ?? ""}
                disabled={disabled}
                onChange={(event) =>
                  setNotes((current) => ({
                    ...current,
                    [member.userId]: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
