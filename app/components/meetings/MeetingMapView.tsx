"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, Users, Calendar, X } from "lucide-react";
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
  userLocation?: {
    latitude: number;
    longitude: number;
  } | null;
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

export function MeetingMapView({ meetings, selectedId, userLocation, onMarkerClick, onMapReady }: MeetingMapViewProps) {
  const { isLoaded, loadError } = useNaverMapsLoader();
  const mapElementId = React.useId();
  const mapRef = React.useRef<naver.maps.Map | null>(null);
  const markersRef = React.useRef<naver.maps.Marker[]>([]);
  const userMarkerRef = React.useRef<naver.maps.Marker | null>(null);
  const userCircleRef = React.useRef<naver.maps.Circle | null>(null);
  const listenersRef = React.useRef<unknown[]>([]);
  const [selectedMeeting, setSelectedMeeting] = React.useState<typeof meetings[0] | null>(null);
  const selectedIdRef = React.useRef<string | null | undefined>(selectedId);

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
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  React.useEffect(() => {
    if (!isLoaded || mapRef.current) {
      return;
    }

    const mapElement = document.getElementById(mapElementId);
    if (!mapElement) {
      return;
    }

    const initialCenter = userLocation
      ? new naver.maps.LatLng(userLocation.latitude, userLocation.longitude)
      : new naver.maps.LatLng(defaultCenter.lat, defaultCenter.lng);

    mapRef.current = new naver.maps.Map(mapElement, {
      center: initialCenter,
      zoom: 12,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
    });
  }, [isLoaded, mapElementId, userLocation]);

  React.useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    listenersRef.current.forEach((listener) => naver.maps.Event.removeListener(listener));
    listenersRef.current = [];
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    meetingsWithLocation.forEach((meeting) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(meeting.latitude, meeting.longitude),
        map: mapRef.current,
        title: meeting.title,
        icon: {
          content: createMeetingMarkerContent(meeting, meeting.id === selectedId),
          anchor: new naver.maps.Point(24, 54),
        },
        zIndex: meeting.id === selectedId ? 20 : 10,
      });

      markersRef.current.push(marker);
      listenersRef.current.push(
        naver.maps.Event.addListener(marker, "click", () => {
          const nextSelectedId = selectedIdRef.current === meeting.id ? "" : meeting.id;
          setSelectedMeeting(nextSelectedId ? meeting : null);
          onMarkerClick?.(nextSelectedId);
        })
      );
    });

    if (userLocation) {
      mapRef.current.panTo(new naver.maps.LatLng(userLocation.latitude, userLocation.longitude));
      mapRef.current.setZoom(14);
    } else if (meetingsWithLocation.length === 1) {
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
  }, [meetingsWithLocation, onMarkerClick, selectedId, userLocation]);

  React.useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    userMarkerRef.current?.setMap(null);
    userCircleRef.current?.setMap(null);
    userMarkerRef.current = null;
    userCircleRef.current = null;

    if (!userLocation) {
      return;
    }

    const position = new naver.maps.LatLng(userLocation.latitude, userLocation.longitude);
    userCircleRef.current = new naver.maps.Circle({
      map: mapRef.current,
      center: position,
      radius: 350,
      strokeColor: "#2563eb",
      strokeOpacity: 0.35,
      strokeWeight: 2,
      fillColor: "#2563eb",
      fillOpacity: 0.12,
    });
    userMarkerRef.current = new naver.maps.Marker({
      position,
      map: mapRef.current,
      title: "내 위치",
      icon: {
        content: createUserLocationMarkerContent(),
        anchor: new naver.maps.Point(13, 13),
      },
      zIndex: 30,
    });
  }, [userLocation, meetingsWithLocation]);

  React.useEffect(() => {
    return () => {
      listenersRef.current.forEach((listener) => naver.maps.Event.removeListener(listener));
      markersRef.current.forEach((marker) => marker.setMap(null));
      userMarkerRef.current?.setMap(null);
      userCircleRef.current?.setMap(null);
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

  const clearSelection = () => {
    setSelectedMeeting(null);
    onMarkerClick?.("");
  };

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">
          {loadError || "지도 로딩 중..."}
        </p>
      </div>
    );
  }

  if (meetingsWithLocation.length === 0 && !userLocation) {
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
        {meetingsWithLocation.length === 0 && userLocation ? (
          <div className="absolute right-4 top-4 z-10 w-[260px] rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">주변 모임이 없습니다</p>
                <p className="mt-1 text-xs text-muted-foreground">
              검색 반경을 넓히거나 카테고리 조건을 바꿔보세요.
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {selectedMeeting && (
          <div className="absolute left-4 top-4 z-10 w-[240px] rounded-lg border bg-background p-3 shadow-lg">
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {selectedMeeting.category}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="선택 해제"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
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
        {userLocation ? "내 위치 기준 · " : ""}
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

function createUserLocationMarkerContent() {
  return `
    <div class="relative flex h-7 w-7 items-center justify-center">
      <div class="absolute h-7 w-7 rounded-full bg-blue-500/25"></div>
      <div class="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-lg"></div>
    </div>
  `;
}

function createMeetingMarkerContent(meeting: MeetingMapItemWithLocation, isSelected: boolean) {
  const participantCount = meeting._count?.participants || 0;

  if (!isSelected) {
    return `
      <div class="relative flex h-10 w-10 items-center justify-center">
        <div class="absolute h-10 w-10 rounded-full bg-blue-500/20"></div>
        <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[11px] font-bold text-white shadow-lg">
          ${participantCount}
        </div>
        <div class="absolute bottom-0 h-3 w-3 rotate-45 border-b-2 border-r-2 border-white bg-blue-600"></div>
      </div>
    `;
  }

  return `
    <div class="relative flex flex-col items-center">
      <div class="min-w-[148px] rounded-xl border border-blue-200 bg-white px-3 py-2 text-zinc-950 shadow-xl">
        <div class="mb-1 flex items-center justify-between gap-2">
          <span class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">${escapeHtml(meeting.category)}</span>
          <span class="text-[10px] font-medium text-zinc-500">${participantCount}/${meeting.maxParticipants}</span>
        </div>
        <div class="max-w-[132px] truncate text-xs font-semibold">${escapeHtml(meeting.title)}</div>
      </div>
      <div class="-mt-1 h-3 w-3 rotate-45 border-b border-r border-blue-200 bg-white"></div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
