"use client";

import * as React from "react";
import { GoogleMap, InfoWindow } from "@react-google-maps/api";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { MapPin, Users, Calendar } from "lucide-react";
import { Button } from "../ui/Button";
import { useGoogleMapsLoader } from "@/lib/google-maps";

interface MeetingMapViewProps {
  meetings: Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    date: Date;
    location: string | null;
    maxParticipants: number;
    latitude?: number | null;
    longitude?: number | null;
    _count?: {
      participants: number;
    };
    distance?: number;
  }>;
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
  onMapReady?: (panTo: (lat: number, lng: number) => void) => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

export function MeetingMapView({ meetings, selectedId, onMarkerClick, onMapReady }: MeetingMapViewProps) {
  const { isLoaded } = useGoogleMapsLoader();
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const markersRef = React.useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedMeeting, setSelectedMeeting] = React.useState<typeof meetings[0] | null>(null);

  const panTo = React.useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(16);
    }
  }, []);

  React.useEffect(() => {
    onMapReady?.(panTo);
  }, [onMapReady, panTo]);

  const meetingsWithLocation = meetings.filter(
    (m): m is typeof m & { latitude: number; longitude: number } =>
      m.latitude !== null && m.latitude !== undefined &&
      m.longitude !== null && m.longitude !== undefined
  );

  React.useEffect(() => {
    if (mapRef.current && meetingsWithLocation.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      meetingsWithLocation.forEach((meeting) => {
        bounds.extend({ lat: meeting.latitude, lng: meeting.longitude });
      });
      mapRef.current.fitBounds(bounds, 50);
    }
  }, [meetingsWithLocation]);

  React.useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    if (!google.maps.marker?.AdvancedMarkerElement) return;

    const map = mapRef.current;

    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    meetingsWithLocation.forEach((meeting) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: meeting.latitude, lng: meeting.longitude },
        title: meeting.title,
      });

      marker.addListener("click", () => {
        setSelectedMeeting(meeting);
        onMarkerClick?.(meeting.id);
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.map = null);
      markersRef.current = [];
    };
  }, [isLoaded, meetingsWithLocation, onMarkerClick]);

  React.useEffect(() => {
    if (selectedId) {
      const meeting = meetingsWithLocation.find(m => m.id === selectedId);
      setSelectedMeeting(meeting || null);
      if (meeting) {
        panTo(meeting.latitude, meeting.longitude);
      }
    } else {
      setSelectedMeeting(null);
    }
  }, [selectedId, meetingsWithLocation, panTo]);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">지도 로딩 중...</p>
      </div>
    );
  }

  if (meetingsWithLocation.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">표시할 모임이 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            장소 정보가 있는 모임만 지도에 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border h-full flex flex-col">
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={12}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
          }}
        >
          {selectedMeeting && (
            <InfoWindow
              position={{ lat: selectedMeeting.latitude!, lng: selectedMeeting.longitude! }}
              onCloseClick={() => {
                setSelectedMeeting(null);
                onMarkerClick?.("");
              }}
            >
              <div className="p-2 min-w-[200px]">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mb-2">
                  {selectedMeeting.category}
                </span>
                <h4 className="font-semibold text-sm mb-1">{selectedMeeting.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedMeeting.location}
                </p>
                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedMeeting.date), "MM/dd HH:mm", { locale: ko })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedMeeting._count?.participants || 0} / {selectedMeeting.maxParticipants}명
                  </div>
                </div>
                <Link href={`/meetings/${selectedMeeting.id}`}>
                  <Button size="sm" className="w-full text-xs">
                    자세히 보기
                  </Button>
                </Link>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
      <div className="bg-muted p-3 text-xs text-muted-foreground flex-none">
        <MapPin className="inline h-3 w-3 mr-1" />
        {meetingsWithLocation.length}개의 모임이 지도에 표시됩니다
        {meetings.length - meetingsWithLocation.length > 0 && (
          <span className="ml-2">
            (장소 정보 없음: {meetings.length - meetingsWithLocation.length}개)
          </span>
        )}
      </div>
    </div>
  );
}
