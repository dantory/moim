"use client";

import * as React from "react";
import { List, Map, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { MeetingList } from "./MeetingList";
import { MeetingMapView } from "./MeetingMapView";
import { MeetingCard } from "./MeetingCard";
import { cn } from "@/lib/utils";

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

export function MeetingViewToggle({ meetings }: MeetingViewToggleProps) {
  const [viewMode, setViewMode] = React.useState<"list" | "map">("map");
  const [isListPanelOpen, setIsListPanelOpen] = React.useState(true);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
        <MeetingList meetings={meetings} />
      ) : (
        <div className="relative">
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
                    <div key={meeting.id} className="w-[180px] shrink-0">
                      <MeetingCard meeting={meeting} />
                    </div>
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
