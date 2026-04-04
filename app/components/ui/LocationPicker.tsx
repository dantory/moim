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
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}`,
          },
        }
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const results = data.documents.map((doc: {
        address_name: string;
        x: string;
        y: string;
      }) => ({
        address: doc.address_name,
        latitude: parseFloat(doc.y),
        longitude: parseFloat(doc.x),
      }));

      setSearchResults(results);
    } catch (error) {
      console.error("Address search failed:", error);
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
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
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

            {searchResults.length === 0 && searchQuery && !isLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                검색 결과가 없습니다
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
