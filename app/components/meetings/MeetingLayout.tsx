"use client";

import * as React from "react";
import { Search, MapPin, LocateFixed, List, Map } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { LocationPicker } from "../ui/LocationPicker";
import { cn } from "@/lib/utils";
import { MeetingMapView } from "./MeetingMapView";
import Link from "next/link";
import { Calendar, MapPin as MapPinIcon, Users } from "lucide-react";
import { formatMeetingDateLong, formatMeetingDateShort } from "@/lib/date-format";
import { getCurrentPosition, getGeolocationErrorMessage } from "@/lib/location";
import { MEETING_CATEGORIES, MEETING_CATEGORY_ALL } from "@/lib/meeting-schema";

const CATEGORIES = [
  { id: MEETING_CATEGORY_ALL, label: MEETING_CATEGORY_ALL },
  ...MEETING_CATEGORIES.map((category) => ({ id: category, label: category })),
];

const RADIUS_OPTIONS = [
  { value: "1", label: "1km" },
  { value: "5", label: "5km" },
  { value: "10", label: "10km" },
  { value: "30", label: "30km" },
];

interface MeetingWithLocation {
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
}

interface MeetingLayoutProps {
  meetings: MeetingWithLocation[];
  errorMessage?: string;
}

export function MeetingLayout({ meetings, errorMessage }: MeetingLayoutProps) {
  const [visibleMeetings, setVisibleMeetings] = React.useState(meetings);
  const [currentCategory, setCurrentCategory] = React.useState<string>(MEETING_CATEGORY_ALL);
  const [currentRadius, setCurrentRadius] = React.useState("5");
  const [search, setSearch] = React.useState("");
  const [isLocating, setIsLocating] = React.useState(false);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const [clientErrorMessage, setClientErrorMessage] = React.useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = React.useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | undefined>(undefined);
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [viewMode, setViewMode] = React.useState<"list" | "map">("map");
  const [selectedMeetingId, setSelectedMeetingId] = React.useState<string | null>(null);
  const mapPanRef = React.useRef<(lat: number, lng: number) => void>(undefined);

  React.useEffect(() => {
    setVisibleMeetings(meetings);
  }, [meetings]);

  const handleMapListClick = (meeting: MeetingWithLocation) => {
    if (selectedMeetingId === meeting.id) {
      setSelectedMeetingId(null);
      return;
    }

    setSelectedMeetingId(meeting.id);

    if (meeting.latitude != null && meeting.longitude != null) {
      mapPanRef.current?.(meeting.latitude, meeting.longitude);
    }
  };

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
    void fetchMeetings({
      category,
      search,
      radius: currentRadius,
      location: userLocation,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchMeetings({
      category: currentCategory,
      search,
      radius: currentRadius,
      location: userLocation,
    });
  };

  React.useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    void getCurrentPosition()
      .then((location) => {
        setSelectedLocation({
          address: "현재 위치",
          ...location,
        });
        setUserLocation(location);
        void fetchMeetings({
          category: currentCategory,
          search,
          radius: currentRadius,
          location,
        });
      })
      .catch(() => {
        setUserLocation(null);
      });
    // Initial location lookup only. Further filtering is driven by controls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    setIsLocating(true);
    setClientErrorMessage(null);
    void getCurrentPosition()
      .then((location) => {
        setSelectedLocation({
          address: "현재 위치",
          ...location,
        });
        setUserLocation(location);
        void fetchMeetings({
          category: currentCategory,
          search,
          radius: currentRadius,
          location,
        });
        setIsLocating(false);
      })
      .catch((error) => {
        setClientErrorMessage(
          `${getGeolocationErrorMessage(error)} 주소나 지도에서 기준 위치를 직접 선택해 주세요.`
        );
        setIsLocating(false);
      });
  };

  const handleSelectedLocationChange = (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    const hasLocation = location.address.trim().length > 0;
    const nextLocation = hasLocation
      ? { latitude: location.latitude, longitude: location.longitude }
      : null;

    setSelectedLocation(hasLocation ? location : undefined);
    setUserLocation(nextLocation);
    void fetchMeetings({
      category: currentCategory,
      search,
      radius: currentRadius,
      location: nextLocation,
    });
  };

  async function fetchMeetings({
    category,
    search,
    radius,
    location,
  }: {
    category: string;
    search: string;
    radius: string;
    location: { latitude: number; longitude: number } | null;
  }) {
    setIsFiltering(true);
    setClientErrorMessage(null);

    try {
      const params = new URLSearchParams();
      if (category !== MEETING_CATEGORY_ALL) {
        params.set("category", category);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (location) {
        params.set("lat", location.latitude.toString());
        params.set("lng", location.longitude.toString());
        params.set("radius", radius);
      }

      const response = await fetch(`/api/meetings?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "모임 목록을 불러오지 못했습니다.");
      }

      setVisibleMeetings(
        data.map((meeting: MeetingWithLocation & { date: string }) => ({
          ...meeting,
          date: new Date(meeting.date),
        }))
      );
      setSelectedMeetingId(null);
    } catch (error) {
      console.error("Failed to filter meetings:", error);
      setClientErrorMessage(
        error instanceof Error ? error.message : "모임 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsFiltering(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex-none px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>내 위치</span>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="모임 검색..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={currentRadius}
              onChange={(e) => {
                const nextRadius = e.target.value;
                setCurrentRadius(nextRadius);
                void fetchMeetings({
                  category: currentCategory,
                  search,
                  radius: nextRadius,
                  location: userLocation,
                });
              }}
              className="h-9 px-2 rounded-md border border-input bg-background text-sm"
            >
              {RADIUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLocationSearch}
              disabled={isLocating || isFiltering}
              className="flex items-center gap-1 h-9"
            >
              <LocateFixed className="h-4 w-4" />
              {isLocating ? "위치 확인 중..." : "주변 모임"}
            </Button>
            <div className="w-64">
              <LocationPicker
                value={selectedLocation}
                onChange={handleSelectedLocationChange}
                placeholder="기준 위치 직접 설정"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-48 border-r bg-muted/30 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">카테고리</h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    currentCategory === cat.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-none px-4 py-2 border-b flex items-center justify-between bg-background">
            <span className="text-sm text-muted-foreground">
              총 {visibleMeetings.length}개의 모임
            </span>
            <div className="inline-flex rounded-md border bg-background p-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1 h-7"
              >
                <List className="h-3.5 w-3.5" />
                목록
              </Button>
              <Button
                variant={viewMode === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="flex items-center gap-1 h-7"
              >
                <Map className="h-3.5 w-3.5" />
                지도
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {errorMessage ? (
              <div className="mx-4 mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            {clientErrorMessage ? (
              <div className="mx-4 mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {clientErrorMessage}
              </div>
            ) : null}
            <div className="relative flex-1 min-h-0">
              {viewMode === "map" ? (
                <div className="absolute inset-0">
                <MeetingMapView
                  meetings={visibleMeetings}
                  selectedId={selectedMeetingId}
                  userLocation={userLocation}
                  onMarkerClick={setSelectedMeetingId}
                  onMapReady={(pan) => { mapPanRef.current = pan; }}
                />
                <div className="absolute bottom-16 left-4 right-4 bg-background/95 backdrop-blur-sm border rounded-xl shadow-xl max-h-[200px]">
                  <div className="px-3 py-2 border-b">
                    <span className="text-sm font-medium">
                      {isFiltering ? "모임 목록 갱신 중..." : "모임 목록"}
                    </span>
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <div className="flex gap-2" style={{ minWidth: "max-content" }}>
                      {visibleMeetings.map((meeting) => (
                        <button
                          key={meeting.id}
                          onClick={() => handleMapListClick(meeting)}
                          className={cn(
                            "w-[180px] shrink-0 bg-card border rounded-lg p-2.5 transition-all text-left",
                            selectedMeetingId === meeting.id
                              ? "ring-2 ring-primary shadow-md"
                              : "hover:shadow-md hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary-100 text-primary-800">
                              {meeting.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              <Users className="w-3 h-3 inline mr-0.5" />
                              {meeting._count?.participants || 0}/{meeting.maxParticipants}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm line-clamp-1 mb-1">{meeting.title}</h4>
                          <div className="text-[10px] text-muted-foreground space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatMeetingDateShort(meeting.date)}
                            </div>
                            {meeting.location && (
                              <div className="flex items-center gap-1">
                                <MapPinIcon className="w-3 h-3" />
                                <span className="line-clamp-1">{meeting.location}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                  {visibleMeetings.map((meeting) => (
                    <Link
                      key={meeting.id}
                      href={`/meetings/${meeting.id}`}
                      className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {meeting.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5 inline mr-1" />
                          {meeting._count?.participants || 0}/{meeting.maxParticipants}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-2">{meeting.title}</h4>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {meeting.description || "설명이 없습니다."}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatMeetingDateLong(meeting.date)}
                        </div>
                        {meeting.location && (
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            <span className="line-clamp-1">{meeting.location}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
