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
  const lastCenterRef = useRef<LatLng | null>(null);
  const lastZoomRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [mapsUnavailable, setMapsUnavailable] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Initialize map only once
  const init = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;

    const mapsLoaded = await loadMaps();
    if (!mapsLoaded) {
      setMapsUnavailable(true);
      return;
    }

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
    lastCenterRef.current = center;
    lastZoomRef.current = zoom;

    onMapReady?.(mapRef.current);
    setReady(true);
  }, [onMapReady]); // Remove center and zoom from dependencies

  // Update map center and zoom without remounting
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Only update center if it actually changed
    const centerChanged = !lastCenterRef.current || 
      lastCenterRef.current.lat !== center.lat || 
      lastCenterRef.current.lng !== center.lng;
    
    const zoomChanged = lastZoomRef.current !== zoom;
    
    if (centerChanged) {
      mapRef.current.setCenter(center);
      lastCenterRef.current = center;
    }
    
    if (zoomChanged) {
      mapRef.current.setZoom(zoom);
      lastZoomRef.current = zoom;
    }
  }, [center, zoom]);

  // Search functionality using our backend proxy
  const onSearchChange = async () => {
    const input = searchInputRef.current;
    if (!input) return;
    const value = input.value.trim();
    if (!value) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(value)}`);
      if (response.ok) {
        const data = await response.json();
        // Transform backend response to match our UI expectations
        const transformedSuggestions = (data.places || []).map((place: any) => ({
          place_id: place.id,
          description: place.displayName?.text || place.formattedAddress || 'Unknown place',
          structured_formatting: {
            main_text: place.displayName?.text || 'Unknown place'
          },
          geometry: place.location
        }));
        setSuggestions(transformedSuggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSuggestions([]);
    }
  };

  const selectPrediction = async (prediction: any) => {
    if (!mapRef.current) return;
    
    // Use the location data from our backend response
    if (prediction.geometry) {
      const pos = { 
        lat: prediction.geometry.latitude, 
        lng: prediction.geometry.longitude 
      };
      
      // Pan to location
      mapRef.current.panTo(pos);
      mapRef.current.setZoom(15);
      
      // Add waypoint if callback provided
      onAddWaypoint?.(pos, prediction.structured_formatting.main_text);
      
      // Clear search
      setSuggestions([]);
      if (searchInputRef.current) {
        searchInputRef.current.value = "";
      }
    }
  };

  const clearWaypoints = () => {
    onClearWaypoints?.();
  };

  useEffect(() => {
    // run once; deps are primitives and onMapReady reference-stable
    void init();
  }, [init]);

  // Early return for missing API key
  if (mapsUnavailable) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="absolute inset-0 rounded-xl overflow-hidden bg-[#F5F1E8] flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-serif mb-2 text-[#2F2B25]">Maps Unavailable</h3>
            <p className="text-[#6B5F53] mb-4">
              Google Maps API key is missing or invalid. Add your API key to enable interactive maps.
            </p>
            <div className="text-sm text-[#8A7F73] bg-[#FFFDF8] border border-[#E5DFD0] rounded-lg p-3">
              <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

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