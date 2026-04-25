import { NextResponse } from "next/server"

const COORDINATE_QUERY_PATTERN = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/

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
    const clientId = process.env.NAVER_MAPS_CLIENT_ID || process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID
    const clientSecret = process.env.NAVER_MAPS_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "네이버 지도 API 키가 설정되지 않았습니다" },
        { status: 500 }
      )
    }

    const coordinateMatch = query.match(COORDINATE_QUERY_PATTERN)
    const data = coordinateMatch
      ? await reverseGeocode({
          latitude: coordinateMatch[1],
          longitude: coordinateMatch[2],
          clientId,
          clientSecret,
        })
      : await geocode({ query, clientId, clientSecret })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

async function geocode({
  query,
  clientId,
  clientSecret,
}: {
  query: string
  clientId: string
  clientSecret: string
}) {
  const response = await fetch(
    `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(
      query
    )}&language=kor`,
    {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
        Accept: "application/json",
      },
    }
  )
  const data = await response.json()

  if (!response.ok || data.status !== "OK") {
    return {
      status: data.status || "REQUEST_DENIED",
      error_message: data.errorMessage || data.error?.message || "검색에 실패했습니다",
      results: [],
    }
  }

  return {
    status: data.addresses?.length ? "OK" : "ZERO_RESULTS",
    results: (data.addresses || []).map(
      (address: {
        roadAddress?: string
        jibunAddress?: string
        englishAddress?: string
        x: string
        y: string
      }) => ({
        formatted_address:
          address.roadAddress || address.jibunAddress || address.englishAddress || query,
        geometry: {
          location: {
            lat: Number(address.y),
            lng: Number(address.x),
          },
        },
      })
    ),
  }
}

async function reverseGeocode({
  latitude,
  longitude,
  clientId,
  clientSecret,
}: {
  latitude: string
  longitude: string
  clientId: string
  clientSecret: string
}) {
  const response = await fetch(
    `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${encodeURIComponent(
      `${longitude},${latitude}`
    )}&orders=roadaddr,addr&output=json`,
    {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
        Accept: "application/json",
      },
    }
  )
  const data = await response.json()

  if (!response.ok || data.status?.code !== 0) {
    return {
      status: "REQUEST_DENIED",
      error_message: data.status?.message || data.error?.message || "주소 변환에 실패했습니다",
      results: [],
    }
  }

  const results = (data.results || []).map((result: NaverReverseGeocodeResult) => ({
    formatted_address: formatReverseGeocodeAddress(result),
    geometry: {
      location: {
        lat: Number(latitude),
        lng: Number(longitude),
      },
    },
  }))

  return {
    status: results.length ? "OK" : "ZERO_RESULTS",
    results,
  }
}

type NaverReverseGeocodeResult = {
  region?: {
    area1?: { name?: string }
    area2?: { name?: string }
    area3?: { name?: string }
    area4?: { name?: string }
  }
  land?: {
    name?: string
    number1?: string
    number2?: string
  }
}

function formatReverseGeocodeAddress(result: NaverReverseGeocodeResult) {
  const region = [
    result.region?.area1?.name,
    result.region?.area2?.name,
    result.region?.area3?.name,
    result.region?.area4?.name,
  ].filter(Boolean)
  const land = [
    result.land?.name,
    result.land?.number1,
    result.land?.number2 ? `-${result.land.number2}` : undefined,
  ].filter(Boolean)

  return [...region, ...land].join(" ")
}
