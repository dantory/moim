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

export function getCurrentPosition(): Promise<Coordinates> {
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusInKm: number
): boolean {
  const distance = calculateDistanceInKm(center, point);
  return distance <= radiusInKm;
}
