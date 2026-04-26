import { getDistance } from "geolib";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  return getDistance(point1, point2, 1);
}

export function calculateDistanceInKm(
  point1: Coordinates,
  point2: Coordinates
): number {
  return getDistance(point1, point2) / 1000;
}

export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)}km`;
}

export function getGeolocationErrorMessage(error: { code: number }): string {
  switch (error.code) {
    case 1:
      return "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요.";
    case 2:
      return "위치 정보를 사용할 수 없습니다.";
    case 3:
      return "위치 요청 시간이 초과되었습니다.";
    default:
      return "위치를 가져올 수 없습니다.";
  }
}

export function shouldRetryGeolocationWithHighAccuracy(error: { code: number }): boolean {
  return error.code === 2 || error.code === 3;
}

export function getGeolocationRequestOptions(): PositionOptions[] {
  return [
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  ];
}

function requestCurrentPosition(options: PositionOptions): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      options
    );
  });
}

export async function getCurrentPosition(): Promise<Coordinates> {
  const [primaryOptions, fallbackOptions] = getGeolocationRequestOptions();

  try {
    return await requestCurrentPosition(primaryOptions);
  } catch (error) {
    if (
      fallbackOptions &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      shouldRetryGeolocationWithHighAccuracy({ code: Number(error.code) })
    ) {
      return requestCurrentPosition(fallbackOptions);
    }

    throw error;
  }
}

export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusInKm: number
): boolean {
  const distance = calculateDistanceInKm(center, point);
  return distance <= radiusInKm;
}
