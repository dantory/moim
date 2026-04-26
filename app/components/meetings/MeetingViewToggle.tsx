"use client";

import * as React from "react";
import { List, Map, ChevronUp, ChevronDown, LocateFixed } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/Button";
import { MeetingList } from "./MeetingList";
import { MeetingMapView } from "./MeetingMapView";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { formatMeetingDateShort } from "@/lib/date-format";
import { getCurrentPosition, getGeolocationErrorMessage } from "@/lib/location";

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

interface MeetingViewToggleProps {
  meetings: MeetingWithLocation[];
}

const RADIUS_OPTIONS = [
  { value: "1", label: "1km" },
  { value: "5", label: "5km" },
  { value: "10", label: "10km" },
  { value: "30", label: "30km" },
];

export function MeetingViewToggle({ meetings }: MeetingViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = React.useState<"list" | "map">("map");
  const [isListPanelOpen, setIsListPanelOpen] = React.useState(true);
  const [isLocating, setIsLocating] = React.useState(false);

  const currentRadius = searchParams.get("radius") || "5";

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    setIsLocating(true);
    void getCurrentPosition()
      .then((position) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", position.latitude.toString());
        params.set("lng", position.longitude.toString());
        params.set("radius", currentRadius);
        router.push(`/?${params.toString()}`);
        setIsLocating(false);
      })
      .catch((error) => {
        alert(getGeolocationErrorMessage(error));
        setIsLocating(false);
      });
  };

  const clearLocationFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lat");
    params.delete("lng");
    params.delete("radius");
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none flex items-center justify-between mb-2">
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
            className="h-8 px-2 rounded-md border border-input bg-background text-sm"
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
            className="flex items-center gap-1"
          >
            <LocateFixed className="h-4 w-4" />
            {isLocating ? "위치 확인 중..." : "주변 모임"}
          </Button>
          {searchParams.has("lat") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLocationFilter}
            >
              위치 필터 해제
            </Button>
          )}
        </div>

        <div className="inline-flex rounded-md border bg-background p-1">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            목록
          </Button>
          <Button
            variant={viewMode === "map" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("map")}
            className="flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            지도
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="flex-1 overflow-y-auto">
          <MeetingList meetings={meetings} />
        </div>
      ) : (
        <div className="relative flex-1 min-h-0">
          <MeetingMapView meetings={meetings} />
          <div
            className={cn(
              "absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm border rounded-xl shadow-xl transition-all duration-300 z-10 max-h-[180px]",
              isListPanelOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
            )}
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b">
              <span className="text-sm font-medium">모임 목록 ({meetings.length}개)</span>
              <button
                onClick={() => setIsListPanelOpen(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2 overflow-x-auto">
              {meetings.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-1">
                  모임이 없습니다
                </p>
              ) : (
                <div className="flex gap-2" style={{ minWidth: "max-content" }}>
                  {meetings.map((meeting) => (
                    <Link
                      key={meeting.id}
                      href={`/meetings/${meeting.id}`}
                      className="w-[160px] shrink-0 bg-card border rounded-lg p-2 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary-100 text-primary-800">
                          {meeting.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Users className="w-3 h-3" />
                          {meeting._count?.participants || 0}/{meeting.maxParticipants}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm line-clamp-1 mb-1">{meeting.title}</h4>
                      <div className="space-y-0.5 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatMeetingDateShort(meeting.date)}
                        </div>
                        {meeting.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{meeting.location}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!isListPanelOpen && (
            <button
              onClick={() => setIsListPanelOpen(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border rounded-full shadow-lg px-4 py-2 flex items-center gap-2 hover:bg-muted transition-colors z-10"
            >
              <ChevronUp className="h-4 w-4" />
              <span className="text-sm">목록 보기 ({meetings.length}개)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
