"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, LocateFixed, List, Map } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { cn } from "@/lib/utils";
import { MeetingMapView } from "./MeetingMapView";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, MapPin as MapPinIcon, Users } from "lucide-react";

const CATEGORIES = [
  { id: "전체", label: "전체" },
  { id: "스터디", label: "스터디" },
  { id: "친목", label: "친목" },
  { id: "욱동", label: "욱동" },
  { id: "취미", label: "취미" },
  { id: "기타", label: "기타" },
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
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCategory = searchParams.get("category") || "전체";
  const currentSearch = searchParams.get("search") || "";
  const currentRadius = searchParams.get("radius") || "5";
  const [search, setSearch] = React.useState(currentSearch);
  const [isLocating, setIsLocating] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"list" | "map">("map");
  const [selectedMeetingId, setSelectedMeetingId] = React.useState<string | null>(null);
  const mapPanRef = React.useRef<(lat: number, lng: number) => void>(undefined);

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category && category !== "전체") {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", position.coords.latitude.toString());
        params.set("lng", position.coords.longitude.toString());
        params.set("radius", currentRadius);
        router.push(`/?${params.toString()}`);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("위치를 가져올 수 없습니다.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
                const params = new URLSearchParams(searchParams.toString());
                if (params.has("lat") && params.has("lng")) {
                  params.set("radius", e.target.value);
                  router.push(`/?${params.toString()}`);
                }
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
              disabled={isLocating}
              className="flex items-center gap-1 h-9"
            >
              <LocateFixed className="h-4 w-4" />
              {isLocating ? "위치 확인 중..." : "주변 모임"}
            </Button>
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
              총 {meetings.length}개의 모임
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
            <div className="relative flex-1 min-h-0">
              {viewMode === "map" ? (
                <div className="absolute inset-0">
                <MeetingMapView
                  meetings={meetings}
                  selectedId={selectedMeetingId}
                  onMarkerClick={setSelectedMeetingId}
                  onMapReady={(pan) => { mapPanRef.current = pan; }}
                />
                <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm border rounded-xl shadow-xl max-h-[200px]">
                  <div className="px-3 py-2 border-b">
                    <span className="text-sm font-medium">모임 목록</span>
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <div className="flex gap-2" style={{ minWidth: "max-content" }}>
                      {meetings.map((meeting) => (
                        <button
                          key={meeting.id}
                          onClick={() => setSelectedMeetingId(meeting.id)}
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
                              {format(new Date(meeting.date), "MM/dd HH:mm", { locale: ko })}
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
                  {meetings.map((meeting) => (
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
                          {format(new Date(meeting.date), "PPP p", { locale: ko })}
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
