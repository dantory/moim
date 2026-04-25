"use client"

import * as React from "react"

const NAVER_MAPS_SCRIPT_ID = "naver-maps-sdk"

export function useNaverMapsLoader() {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (window.naver?.maps) {
      setIsLoaded(true)
      return
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID
    if (!clientId) {
      setLoadError("NAVER Maps Client ID가 설정되지 않았습니다.")
      return
    }

    const existingScript = document.getElementById(NAVER_MAPS_SCRIPT_ID) as
      | HTMLScriptElement
      | null

    window.__naverMapsReady = () => {
      setIsLoaded(true)
    }

    if (existingScript) {
      if (window.naver?.maps) {
        setIsLoaded(true)
      }
      return
    }

    const script = document.createElement("script")
    script.id = NAVER_MAPS_SCRIPT_ID
    script.async = true
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      clientId
    )}&callback=__naverMapsReady`
    script.onerror = () => {
      setLoadError("네이버 지도를 불러오지 못했습니다.")
    }

    document.head.appendChild(script)
  }, [])

  return { isLoaded, loadError }
}
