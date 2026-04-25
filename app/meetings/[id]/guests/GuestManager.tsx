"use client"

import { useState, useTransition } from "react"
import { Trash2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/app/components/ui/Button"
import { Input } from "@/app/components/ui/Input"

interface GuestManagerProps {
  meetingId: string
  guests: Array<{
    id: string
    name: string
    phoneNumber: string | null
    note: string | null
    createdAtLabel: string
  }>
}

export function GuestManager({ meetingId, guests }: GuestManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null)

  const refresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const createGuest = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/meetings/${meetingId}/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phoneNumber,
          note,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "게스트 등록에 실패했습니다.")
      }

      setName("")
      setPhoneNumber("")
      setNote("")
      refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "게스트 등록 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteGuest = async (guestId: string) => {
    setDeletingGuestId(guestId)
    setError(null)

    try {
      const response = await fetch(
        `/api/meetings/${meetingId}/guests?guestId=${encodeURIComponent(guestId)}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "게스트 삭제에 실패했습니다.")
      }

      refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "게스트 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeletingGuestId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">게스트 등록</p>
            <p className="text-sm text-muted-foreground">
              오늘 참석하는 임시 게스트를 기록합니다.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="게스트 이름"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting || isPending}
          />
          <Input
            placeholder="연락처 또는 식별 메모"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            disabled={isSubmitting || isPending}
          />
        </div>
        <textarea
          className="mt-3 flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="메모 예시: 운영자 초대, 오늘만 참석, 다음달 가입 검토"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={isSubmitting || isPending}
        />
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            disabled={isSubmitting || isPending || name.trim().length === 0}
            onClick={createGuest}
          >
            {isSubmitting ? "등록 중..." : "게스트 등록"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {guests.length > 0 ? (
          guests.map((guest) => (
            <div key={guest.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{guest.name}</p>
                  <p className="text-sm text-muted-foreground">{guest.createdAtLabel}</p>
                  {guest.phoneNumber ? (
                    <p className="text-sm text-muted-foreground">연락처: {guest.phoneNumber}</p>
                  ) : null}
                  {guest.note ? <p className="text-sm text-muted-foreground">{guest.note}</p> : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingGuestId === guest.id || isPending}
                  onClick={() => deleteGuest(guest.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {deletingGuestId === guest.id ? "삭제 중..." : "삭제"}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="font-medium">등록된 게스트가 없습니다</p>
            <p className="mt-1 text-sm text-muted-foreground">
              참여자가 적은 날 임시 게스트를 등록해 운영 흐름을 기록해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
