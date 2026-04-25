import { z } from "zod"

export const MEETING_CATEGORIES = ["스터디", "친목", "운동", "취미", "기타"] as const
export const MEETING_CATEGORY_ALL = "전체" as const

export const meetingCategorySchema = z.enum(MEETING_CATEGORIES)

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional()

const baseMeetingSchema = z.object({
  title: z.string().trim().min(2, "제목은 2자 이상이어야 합니다."),
  description: optionalTrimmedString.refine(
    (value) => value === undefined || value.length <= 2000,
    "설명은 2000자 이하여야 합니다."
  ),
  category: meetingCategorySchema,
  maxParticipants: z
    .number()
    .int("참여 인원은 정수여야 합니다.")
    .min(2, "최소 2명 이상이어야 합니다.")
    .max(100, "최대 100명까지 가능합니다."),
  date: z.date().refine((value) => !Number.isNaN(value.getTime()), {
    message: "올바른 날짜를 입력해주세요.",
  }),
  location: optionalTrimmedString.refine(
    (value) => value === undefined || value.length <= 255,
    "장소는 255자 이하여야 합니다."
  ),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

export const meetingCreateSchema = baseMeetingSchema
  .refine((value) => value.date > new Date(), {
    message: "과거 날짜는 선택할 수 없습니다.",
    path: ["date"],
  })
  .refine(
    (value) => (value.location ? value.latitude !== undefined && value.longitude !== undefined : true),
    {
      message: "장소를 선택했다면 좌표 정보도 함께 필요합니다.",
      path: ["location"],
    }
  )

export const meetingUpdateSchema = baseMeetingSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 값을 하나 이상 보내주세요.",
  })
  .refine(
    (value) =>
      value.location === undefined ||
      value.location === "" ||
      (value.latitude !== undefined && value.longitude !== undefined),
    {
      message: "장소를 수정했다면 좌표 정보도 함께 필요합니다.",
      path: ["location"],
    }
  )

export const meetingQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().trim().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().positive().optional(),
})

export type MeetingCreateInput = z.infer<typeof meetingCreateSchema>
export type MeetingUpdateInput = z.infer<typeof meetingUpdateSchema>
