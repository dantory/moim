"use client";

import * as React from "react";
import { List, Map } from "lucide-react";
import { Button } from "../ui/Button";
import { MeetingList } from "./MeetingList";
import { MeetingMapView } from "./MeetingMapView";

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
        <MeetingMapView meetings={meetings} />
      )}
    </div>
  );
}
