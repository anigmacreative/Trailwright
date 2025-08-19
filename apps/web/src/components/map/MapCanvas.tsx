// apps/web/src/components/map/MapCanvas.tsx
"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { getLoader, loadMaps } from "@/lib/google-maps";
import { EARTH_TONES_MAP_STYLE } from '@/styles/earth-style';

type LatLng = google.maps.LatLngLiteral;

interface MapCanvasProps {
  center?: LatLng;
  zoom?: number;
  className?: string;
  children?: React.ReactNode; // MarkersLayer / RouteLayer mount inside
  onMapReady?: (map: google.maps.Map) => void;
  onAddWaypoint?: (pos: LatLng, title?: string) => void; // For search results
  onClearWaypoints?: () => void;
}

export default function MapCanvas({
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 12,
  className = "",
  children,
  onMapReady,
  onAddWaypoint,
  onClearWaypoints,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const acServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const [ready, setReady] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);

  const init = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;

    await getLoader().load(); // ensure script tag
    await loadMaps(); // ensure libs

    const mapOptions: google.maps.MapOptions = {
      center,
      zoom,
      styles: EARTH_TONES_MAP_STYLE,
      gestureHandling: "greedy",
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
    };

    // Only set mapId if it exists (required for AdvancedMarkerElement)
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;
    if (mapId) {
      mapOptions.mapId = mapId;
    }

    mapRef.current = new google.maps.Map(containerRef.current, mapOptions);

    // Initialize AutocompleteService for search
    acServiceRef.current = new google.maps.places.AutocompleteService();

    onMapReady?.(mapRef.current);
    setReady(true);
  }, [center, zoom, onMapReady]);

  // Search functionality
  const onSearchChange = async () => {
    const svc = acServiceRef.current;
    const input = searchInputRef.current;
    if (!svc || !input) return;
    const value = input.value.trim();
    if (!value) {
      setSuggestions([]);
      return;
    }
    svc.getPlacePredictions({ input: value }, (preds) => {
      setSuggestions(preds || []);
    });
  };

  const selectPrediction = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!mapRef.current) return;
    
    // Use PlacesService to get details
    const placesService = new google.maps.places.PlacesService(mapRef.current);
    placesService.getDetails({ placeId: prediction.place_id }, (result, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
        const location = result.geometry.location;
        const pos = { lat: location.lat(), lng: location.lng() };
        
        // Pan to location
        mapRef.current!.panTo(pos);
        mapRef.current!.setZoom(15);
        
        // Add waypoint if callback provided
        onAddWaypoint?.(pos, result.name || prediction.structured_formatting.main_text);
        
        // Clear search
        setSuggestions([]);
        if (searchInputRef.current) {
          searchInputRef.current.value = "";
        }
      }
    });
  };

  const clearWaypoints = () => {
    onClearWaypoints?.();
  };

  useEffect(() => {
    // run once; deps are primitives and onMapReady reference-stable
    void init();
  }, [init]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="absolute inset-0 rounded-xl overflow-hidden" />
      
      {/* Search Controls */}
      {ready && (
        <div className="absolute left-4 top-4 z-30 w-[420px] space-y-2">
          <div className="rounded-xl border border-[#DED6C6] bg-[#FFFDF8]/95 backdrop-blur px-3 py-2 shadow-sm">
            <input
              ref={searchInputRef}
              onChange={onSearchChange}
              placeholder="Search a place…"
              className="w-full rounded-lg bg-transparent px-2 py-2 text-[15px] text-[#2F2B25] placeholder-[#8A7F73] outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={clearWaypoints}
                className="rounded-lg border border-[#DED6C6] px-3 py-1 text-sm text-[#2F2B25] hover:bg-[#F5F1E8]"
              >
                Clear waypoints
              </button>
              <span className="text-xs text-[#6B5F53]">Tip: right-click a marker to delete</span>
            </div>
          </div>

          {/* Suggestion dropdown container */}
          {suggestions.length > 0 && (
            <div className="rounded-xl border border-[#DED6C6] bg-[#FFFDF8] shadow max-h-72 overflow-auto">
              {suggestions.map((s) => (
                <button
                  key={s.place_id}
                  className="block w-full text-left px-4 py-2 text-[#2F2B25] hover:bg-[#F5F1E8] first:rounded-t-xl last:rounded-b-xl"
                  onClick={() => selectPrediction(s)}
                >
                  {s.description}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mount children only when map exists to avoid twitching */}
      {ready && mapRef.current && React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, { map: mapRef.current });
      })}
    </div>
  );
}