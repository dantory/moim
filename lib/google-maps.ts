"use client";

import { useJsApiLoader } from "@react-google-maps/api";

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export function useGoogleMapsLoader() {
  return useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });
}
