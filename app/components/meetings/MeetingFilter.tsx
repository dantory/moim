"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "../ui/Input"
import { Button } from "../ui/Button"

const CATEGORIES = ["전체", "스터디", "친목", "운동", "취미", "기타"]

export function MeetingFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentCategory = searchParams.get("category") || "전체"
  const currentSearch = searchParams.get("search") || ""

  const [search, setSearch] = useState(currentSearch)

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

      <div className="flex flex-wrap gap-2">
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
      </div>
    </div>
  )
}
