"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { MapPin, Search, LocateFixed } from "lucide-react"

import { Input } from "../ui/Input"
import { Button } from "../ui/Button"

const CATEGORIES = ["전체", "스터디", "친목", "욱동", "취미", "기타"]
const RADIUS_OPTIONS = [
  { value: "1", label: "1km" },
  { value: "5", label: "5km" },
  { value: "10", label: "10km" },
  { value: "30", label: "30km" },
]

export function MeetingFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get("category") || "전체"
  const currentSearch = searchParams.get("search") || ""
  const currentRadius = searchParams.get("radius") || "5"

  const [search, setSearch] = useState(currentSearch)
  const [isLocating, setIsLocating] = useState(false)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "전체") {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleCategoryChange = (category: string) => {
    router.push(`/?${createQueryString("category", category)}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/?${createQueryString("search", search)}`)
  }

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("lat", position.coords.latitude.toString())
        params.set("lng", position.coords.longitude.toString())
        params.set("radius", currentRadius)
        router.push(`/?${params.toString()}`)
        setIsLocating(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        alert("Unable to get your location")
        setIsLocating(false)
      }
    )
  }

  const clearLocationFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("lat")
    params.delete("lng")
    params.delete("radius")
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="space-y-4 mb-8">
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="모임 검색..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit">검색</Button>
      </form>

      <div className="flex flex-wrap gap-2 items-center">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={currentCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(category)}
            className="rounded-full"
          >
            {category}
          </Button>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={currentRadius}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString())
              if (params.has("lat") && params.has("lng")) {
                params.set("radius", e.target.value)
                router.push(`/?${params.toString()}`)
              }
            }}
            className="h-8 px-2 rounded-md border border-input bg-background text-sm"
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocationSearch}
            disabled={isLocating}
            className="flex items-center gap-1"
          >
            <LocateFixed className="h-4 w-4" />
            {isLocating ? "위치 확인 중..." : "주변 모임"}
          </Button>
          {searchParams.has("lat") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLocationFilter}
            >
              위치 필터 해제
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
