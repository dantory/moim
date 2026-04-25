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

      class Marker {
        constructor(options: {
          position: LatLng
          map?: Map | null
          title?: string
          draggable?: boolean
        })
        setMap(map: Map | null): void
        setPosition(position: LatLng): void
        getPosition(): LatLng
      }

      namespace Event {
        function addListener(
          target: Map | Marker,
          eventName: string,
          listener: (event: { coord?: LatLng }) => void
        ): { remove: () => void }
      }
    }
  }
}

export {}
