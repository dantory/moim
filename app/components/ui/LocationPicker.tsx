"use client";

import * as React from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  value?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  onChange: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  placeholder?: string;
}

export function LocationPicker({
  value,
  onChange,
  placeholder = "장소를 검색하세요",
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<
    Array<{
      address: string;
      latitude: number;
      longitude: number;
    }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/geocode?query=${encodeURIComponent(searchQuery)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "검색 중 오류가 발생했습니다");
        setSearchResults([]);
        return;
      }

      if (data.status !== "OK") {
        let errorMessage = "검색에 실패했습니다";
        switch (data.status) {
          case "ZERO_RESULTS":
            errorMessage = "검색 결과가 없습니다";
            break;
          case "OVER_QUERY_LIMIT":
            errorMessage = "API 사용량 한도를 초과했습니다";
            break;
          case "REQUEST_DENIED":
            errorMessage = "API 요청이 거부되었습니다";
            break;
          case "INVALID_REQUEST":
            errorMessage = "잘못된 요청입니다";
            break;
          default:
            errorMessage = `오류: ${data.status}`;
        }
        setError(errorMessage);
        setSearchResults([]);
        return;
      }

      const results = data.results.map((result: {
        formatted_address: string;
        geometry: {
          location: {
            lat: number;
            lng: number;
          };
        };
      }) => ({
        address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      }));

      setSearchResults(results);
      if (results.length === 0) {
        setError("검색 결과가 없습니다");
      }
    } catch (err) {
      console.error("Address search failed:", err);
      setError(err instanceof Error ? err.message : "검색 중 오류가 발생했습니다");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    onChange(result);
    setIsOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleClear = () => {
    onChange({ address: "", latitude: 0, longitude: 0 });
    setError(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsOpen(true);
            setError(null);
          }}
          className={cn(
            "flex-1 justify-start text-left font-normal",
            !value?.address && "text-muted-foreground"
          )}
        >
          <MapPin className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {value?.address || placeholder}
          </span>
        </Button>
        {value?.address && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-background border border-border rounded-md shadow-lg p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="주소 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchAddress()}
              />
              <Button
                type="button"
                onClick={searchAddress}
                disabled={isLoading}
              >
                {isLoading ? "검색 중..." : "검색"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-b-0 transition-colors"
                  >
                    <p className="font-medium">{result.address}</p>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center py-4">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
