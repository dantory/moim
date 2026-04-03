"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/Button"

interface JoinButtonProps {
  meetingId: string
  isParticipating: boolean
  isFull: boolean
  isCreator: boolean
  isAuthenticated: boolean
}

export function JoinButton({
  meetingId,
  isParticipating,
  isFull,
  isCreator,
  isAuthenticated,
}: JoinButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async () => {
    if (!isAuthenticated) {
      router.push("/auth/signin")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/meetings/${meetingId}/join`, {
        method: isParticipating ? "DELETE" : "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "요청 처리에 실패했습니다.")
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCreator) {
    return null
  }

  if (isParticipating) {
    return (
      <Button
        variant="destructive"
        className="w-full sm:w-auto"
        onClick={handleJoin}
        disabled={isLoading}
      >
        {isLoading ? "처리 중..." : "참여 취소하기"}
      </Button>
    )
  }

  return (
    <Button
      className="w-full sm:w-auto"
      onClick={handleJoin}
      disabled={isFull || isLoading}
    >
      {isLoading ? "처리 중..." : isFull ? "모집 마감" : "참여하기"}
    </Button>
  )
}
