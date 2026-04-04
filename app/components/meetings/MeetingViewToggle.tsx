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
  const [viewMode, setViewMode] = React.useState<"list" | "map">("list");
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
              "absolute bottom-0 left-0 right-0 bg-background border-t rounded-t-lg shadow-lg transition-transform duration-300 z-10",
              isListPanelOpen ? "translate-y-0" : "translate-y-[calc(100%-40px)]"
            )}
          >
            <button
              onClick={() => setIsListPanelOpen(!isListPanelOpen)}
              className="w-full flex items-center justify-center py-2 border-b hover:bg-muted transition-colors"
            >
              {isListPanelOpen ? (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  <span className="text-xs">목록 접기</span>
                </>
              ) : (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  <span className="text-xs">목록 보기 ({meetings.length}개)</span>
                </>
              )}
            </button>
            
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
              {meetings.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  모임이 없습니다
                </p>
              ) : (
                meetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
