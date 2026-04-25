"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, Users, Calendar } from "lucide-react";
import { Button } from "../ui/Button";
import { useNaverMapsLoader } from "@/lib/naver-maps";
import { formatMeetingDateShort } from "@/lib/date-format";

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

type MeetingMapItem = MeetingMapViewProps["meetings"][number];
type MeetingMapItemWithLocation = MeetingMapItem & {
  latitude: number;
  longitude: number;
};

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

export function MeetingMapView({ meetings, selectedId, onMarkerClick, onMapReady }: MeetingMapViewProps) {
  const { isLoaded, loadError } = useNaverMapsLoader();
  const mapElementId = React.useId();
  const mapRef = React.useRef<naver.maps.Map | null>(null);
  const markersRef = React.useRef<naver.maps.Marker[]>([]);
  const listenersRef = React.useRef<Array<{ remove: () => void }>>([]);
  const [selectedMeeting, setSelectedMeeting] = React.useState<typeof meetings[0] | null>(null);

  const panTo = React.useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.panTo(new naver.maps.LatLng(lat, lng));
      mapRef.current.setZoom(16);
    }
  }, []);

  React.useEffect(() => {
    onMapReady?.(panTo);
  }, [onMapReady, panTo]);

  const meetingsWithLocation = React.useMemo(
    () =>
      meetings.filter(
        (meeting): meeting is MeetingMapItemWithLocation =>
          meeting.latitude !== null &&
          meeting.latitude !== undefined &&
          meeting.longitude !== null &&
          meeting.longitude !== undefined
      ),
    [meetings]
  );

  React.useEffect(() => {
    if (!isLoaded || mapRef.current) {
      return;
    }

    const mapElement = document.getElementById(mapElementId);
    if (!mapElement) {
      return;
    }

    mapRef.current = new naver.maps.Map(mapElement, {
      center: new naver.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
      zoom: 12,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
    });
  }, [isLoaded, mapElementId]);

  React.useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    listenersRef.current.forEach((listener) => listener.remove());
    listenersRef.current = [];
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    meetingsWithLocation.forEach((meeting) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(meeting.latitude, meeting.longitude),
        map: mapRef.current,
        title: meeting.title,
      });

      markersRef.current.push(marker);
      listenersRef.current.push(
        naver.maps.Event.addListener(marker, "click", () => {
          setSelectedMeeting(meeting);
          onMarkerClick?.(meeting.id);
        })
      );
    });

    if (meetingsWithLocation.length === 1) {
      const meeting = meetingsWithLocation[0];
      mapRef.current.panTo(new naver.maps.LatLng(meeting.latitude, meeting.longitude));
      mapRef.current.setZoom(16);
    } else if (meetingsWithLocation.length > 1) {
      const bounds = new naver.maps.LatLngBounds();
      meetingsWithLocation.forEach((meeting) => {
        bounds.extend(new naver.maps.LatLng(meeting.latitude, meeting.longitude));
      });
      mapRef.current.fitBounds(bounds, 50);
    }
  }, [meetingsWithLocation, onMarkerClick]);

  React.useEffect(() => {
    return () => {
      listenersRef.current.forEach((listener) => listener.remove());
      markersRef.current.forEach((marker) => marker.setMap(null));
      mapRef.current?.destroy();
    };
  }, []);

  React.useEffect(() => {
    if (selectedId) {
      const meeting = meetingsWithLocation.find((item) => item.id === selectedId);
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
        <p className="text-muted-foreground">
          {loadError || "지도 로딩 중..."}
        </p>
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
        <div id={mapElementId} className="h-full w-full" />
        {selectedMeeting && (
          <div className="absolute left-4 top-4 z-10 w-[240px] rounded-lg border bg-background p-3 shadow-lg">
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
                {formatMeetingDateShort(selectedMeeting.date)}
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
        )}
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
