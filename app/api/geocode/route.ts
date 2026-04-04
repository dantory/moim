import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json(
      { error: "검색어가 필요합니다" },
      { status: 400 }
    )
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다" },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${apiKey}&language=ko`
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
