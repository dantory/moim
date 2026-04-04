"use client";

import * as React from "react";
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

interface MeetingSplitViewProps {
  meetings: MeetingWithLocation[];
}

export function MeetingSplitView({ meetings }: MeetingSplitViewProps) {
  const [selectedMeetingId, setSelectedMeetingId] = React.useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">모임 목록</h2>
        <div className="max-h-[600px] overflow-y-auto">
          <MeetingList 
            meetings={meetings} 
            onMeetingClick={(id) => setSelectedMeetingId(id)}
            selectedId={selectedMeetingId}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">지도 보기</h2>
        <MeetingMapView 
          meetings={meetings} 
          selectedId={selectedMeetingId}
          onMarkerClick={(id) => setSelectedMeetingId(id)}
        />
      </div>
    </div>
  );
}
