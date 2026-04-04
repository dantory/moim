"use client";

import * as React from "react";
import { X, MapPin, Search } from "lucide-react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Button } from "./Button";
import { Input } from "./Input";
import { cn } from "@/lib/utils";
import { useGoogleMapsLoader } from "@/lib/google-maps";

interface MapLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

export function MapLocationPicker({
  isOpen,
  onClose,
  onSelect,
  initialLocation,
}: MapLocationPickerProps) {
  const { isLoaded } = useGoogleMapsLoader();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [markerPosition, setMarkerPosition] = React.useState<
    google.maps.LatLngLiteral
  >(
    initialLocation
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : defaultCenter
  );
  const [selectedAddress, setSelectedAddress] = React.useState(
    initialLocation?.address || ""
  );
  const [isSearching, setIsSearching] = React.useState(false);

  const mapRef = React.useRef<google.maps.Map | null>(null);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `/api/geocode?query=${lat},${lng}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        setSelectedAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/geocode?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;
        
        setMarkerPosition({ lat, lng });
        setSelectedAddress(result.formatted_address);
        
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(16);
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    onSelect({
      address: selectedAddress,
      latitude: markerPosition.lat,
      longitude: markerPosition.lng,
    });
    onClose();
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            장소 선택
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="장소 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !isLoaded}
            >
              {isSearching ? "검색 중..." : "검색"}
            </Button>
          </div>

          {selectedAddress && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">선택된 위치:</p>
              <p className="text-sm text-muted-foreground">{selectedAddress}</p>
            </div>
          )}

          <div className="rounded-md overflow-hidden border">
            {!isLoaded ? (
              <div className="h-[400px] flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">지도 로딩 중...</p>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={markerPosition}
                zoom={14}
                onClick={handleMapClick}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                <Marker
                  position={markerPosition}
                  draggable={true}
                  onDragEnd={handleMarkerDragEnd}
                />
              </GoogleMap>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            지도를 클릭하거나 마커를 드래그하여 위치를 선택하세요
          </p>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-muted">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedAddress}
          >
            선택하기
          </Button>
        </div>
      </div>
    </div>
  );
}
