declare global {
  interface Window {
    naver?: typeof naver
    __naverMapsReady?: () => void
  }

  namespace naver {
    namespace maps {
      class LatLng {
        constructor(lat: number, lng: number)
        lat(): number
        lng(): number
      }

      class LatLngBounds {
        constructor()
        extend(latlng: LatLng): void
      }

      class Map {
        constructor(element: HTMLElement | string, options?: Record<string, unknown>)
        panTo(latlng: LatLng): void
        setZoom(zoom: number): void
        fitBounds(bounds: LatLngBounds, padding?: number): void
        destroy(): void
      }

      class Circle {
        constructor(options: {
          map?: Map | null
          center: LatLng
          radius?: number
          strokeColor?: string
          strokeOpacity?: number
          strokeWeight?: number
          fillColor?: string
          fillOpacity?: number
        })
        setMap(map: Map | null): void
      }

      class Marker {
        constructor(options: {
          position: LatLng
          map?: Map | null
          title?: string
          draggable?: boolean
          icon?: {
            content: string
            anchor?: Point
          }
          zIndex?: number
        })
        setMap(map: Map | null): void
        setPosition(position: LatLng): void
        getPosition(): LatLng
      }

      class Point {
        constructor(x: number, y: number)
      }

      namespace Event {
        function addListener(
          target: Map | Marker,
          eventName: string,
          listener: (event: { coord?: LatLng }) => void
        ): unknown
        function removeListener(listener: unknown): void
      }
    }
  }
}

export {}
