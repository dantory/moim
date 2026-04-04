"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/Button"

interface DeleteButtonProps {
  meetingId: string
}

export function DeleteButton({ meetingId }: DeleteButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("정말로 이 모임을 삭제하시겠습니까?\n삭제된 모임은 복구할 수 없습니다.")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "모임 삭제에 실패했습니다")
      }

      alert("모임이 삭제되었습니다")
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Failed to delete meeting:", error)
      alert(error instanceof Error ? error.message : "모임 삭제에 실패했습니다")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-2"
    >
      <Trash2 className="w-4 h-4" />
      {isDeleting ? "삭제 중..." : "삭제하기"}
    </Button>
  )
}
