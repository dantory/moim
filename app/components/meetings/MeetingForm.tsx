"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/Card"

const CATEGORIES = ["스터디", "친목", "운동", "취미", "기타"]

const meetingSchema = z.object({
  title: z.string().min(2, "제목은 2자 이상이어야 합니다."),
  description: z.string().optional(),
  category: z.string().min(1, "카테고리를 선택해주세요."),
  maxParticipants: z.number().min(2, "최소 2명 이상이어야 합니다.").max(100, "최대 100명까지 가능합니다."),
  date: z.string().min(1, "날짜를 선택해주세요."),
  location: z.string().optional(),
})

type MeetingValues = z.infer<typeof meetingSchema>

interface MeetingFormProps {
  initialData?: {
    id: string
    title: string
    description: string | null
    category: string
    maxParticipants: number
    date: Date | string
    location: string | null
  }
  isEditing?: boolean
}

export function MeetingForm({ initialData, isEditing }: MeetingFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const defaultValues = initialData
    ? {
        ...initialData,
        description: initialData.description || undefined,
        location: initialData.location || undefined,
        date: new Date(initialData.date).toISOString().slice(0, 16),
      }
    : {
        title: "",
        description: "",
        category: "스터디",
        maxParticipants: 10,
        date: "",
        location: "",
      }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MeetingValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues,
  })

  const onSubmit = async (data: MeetingValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const url = isEditing && initialData ? `/api/meetings/${initialData.id}` : "/api/meetings"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          date: new Date(data.date).toISOString(),
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "모임 저장에 실패했습니다.")
      }

      const result = await response.json()
      router.push(`/meetings/${result.id}`)
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("오류가 발생했습니다.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "모임 수정" : "새 모임 만들기"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              모임 이름 <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              placeholder="모임 이름을 입력하세요"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              카테고리 <span className="text-destructive">*</span>
            </label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register("category")}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                일시 <span className="text-destructive">*</span>
              </label>
              <Input
                id="date"
                type="datetime-local"
                {...register("date")}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="maxParticipants" className="text-sm font-medium">
                최대 인원 <span className="text-destructive">*</span>
              </label>
              <Input
                id="maxParticipants"
                type="number"
                min="2"
                max="100"
                {...register("maxParticipants", { valueAsNumber: true })}
              />
              {errors.maxParticipants && (
                <p className="text-sm text-destructive">
                  {errors.maxParticipants.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              장소
            </label>
            <Input
              id="location"
              placeholder="모임 장소를 입력하세요 (온라인인 경우 링크)"
              {...register("location")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              상세 설명
            </label>
            <textarea
              id="description"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="모임에 대한 상세한 설명을 적어주세요"
              {...register("description")}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
