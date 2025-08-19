"use client";
import dynamic from "next/dynamic";
import { useItineraryState } from "@/state/itineraryStore";
import ItineraryPanel from "@/components/itinerary/ItineraryPanel";
import { useEffect, useMemo, useCallback, useState } from "react";
import { Stop } from "@/types/itinerary";

const MapCanvas = dynamic(() => import("@/components/map/MapCanvas"), { ssr: false });
const MarkersLayer = dynamic(() => import("@/components/map/MarkersLayer"), { ssr: false });
const RouteLayer = dynamic(() => import("@/components/map/RouteLayer"), { ssr: false });

export default function DevMapPage() {
  const {
    trip, activeDay, setActiveDayIndex, addDay, removeDay,
    addStopToActiveDay, removeStop, reorderStops, setStopMeta,
    setRouteStats, replaceTrip, totalCost, activeDayCost,
  } = useItineraryState();

  // Convert stops to waypoints for the new architecture
  const waypoints: google.maps.LatLngLiteral[] = useMemo(() => {
    return activeDay.stops.map(stop => ({ lat: stop.lat, lng: stop.lng }));
  }, [activeDay.stops]);

  // Load state from URL on mount if ?state= parameter exists
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stateParam = urlParams.get('state');
    
    if (stateParam) {
      try {
        const sharedTrip = JSON.parse(decodeURIComponent(stateParam));
        replaceTrip(sharedTrip);
        
        // Clean up URL after loading state (optional)
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } catch (error) {
        console.error('Failed to load shared trip state:', error);
        // Continue with default state if parsing fails
      }
    }
  }, [replaceTrip]);

  // Handle marker move (drag)
  const handleMarkerMove = useCallback((index: number, pos: google.maps.LatLngLiteral) => {
    const stopId = activeDay.stops[index]?.id;
    if (stopId) {
      setStopMeta(stopId, { lat: pos.lat, lng: pos.lng });
    }
  }, [activeDay.stops, setStopMeta]);

  // Handle marker delete (right-click)
  const handleMarkerDelete = useCallback((index: number) => {
    const stopId = activeDay.stops[index]?.id;
    if (stopId) {
      removeStop(stopId);
    }
  }, [activeDay.stops, removeStop]);

  // Handle map click to add waypoint
  const handleMapClick = useCallback((map: google.maps.Map) => {
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        addStopToActiveDay({
          title: `Stop ${activeDay.stops.length + 1}`,
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
      }
    });
  }, [addStopToActiveDay, activeDay.stops.length]);

  // Handle search result selection
  const handleAddWaypoint = useCallback((pos: google.maps.LatLngLiteral, title?: string) => {
    addStopToActiveDay({
      title: title || `Stop ${activeDay.stops.length + 1}`,
      lat: pos.lat,
      lng: pos.lng,
    });
  }, [addStopToActiveDay, activeDay.stops.length]);

  // Handle clear waypoints
  const handleClearWaypoints = useCallback(() => {
    activeDay.stops.slice().forEach(stop => removeStop(stop.id));
  }, [activeDay.stops, removeStop]);

  // Handle note/cost edits coming from panel row
  const panel = useMemo(() => (
    <ItineraryPanel
      day={activeDay}
      dayIndex={trip.activeDayIndex}
      onRemoveStop={(id) => removeStop(id)}
      onReorderStops={(from, to) => {
        if (from < 0 || to < 0) return; // ignore invalid moves
        reorderStops(from, to);
      }}
      onOptimize={() => {
        // TODO: Implement TSP optimization for waypoints
        console.log("Optimize day requested - implement TSP optimization");
      }}
      onEditNote={(id, note) => setStopMeta(id, { note })}
      onEditCost={(id, cost) => setStopMeta(id, { cost })}
      activeDayCost={activeDayCost}
      distanceText={activeDay.distanceText}
      durationText={activeDay.durationText}
    />
  ), [activeDay, trip.activeDayIndex, removeStop, reorderStops, setStopMeta, activeDayCost]);

  // Day tabs
  const tabs = (
    <div className="flex items-center gap-2">
      {trip.days.map((d, i) => (
        <button
          key={d.id}
          onClick={() => setActiveDayIndex(i)}
          className={`rounded-xl border px-3 py-1 text-sm ${
            i === trip.activeDayIndex ? "border-[#C85C5C] bg-[#C85C5C] text-white" : "border-[#E5DFD0] text-[#6B5F53] hover:bg-[#F5F1E8]"
          }`}
        >
          {d.title}
        </button>
      ))}
      <button onClick={addDay} className="rounded-xl border border-[#E5DFD0] px-3 py-1 text-sm text-[#2F2B25] hover:bg-[#F5F1E8]">+ Day</button>
      {trip.days.length > 1 && (
        <button onClick={() => removeDay(trip.days[trip.activeDayIndex].id)} className="rounded-xl border border-[#E5DFD0] px-3 py-1 text-sm text-[#2F2B25] hover:bg-[#F5F1E8]">− Day</button>
      )}
    </div>
  );

  // Share link: encode state in URL
  const share = () => {
    const data = encodeURIComponent(JSON.stringify(trip));
    const url = `${location.origin}/dev/map?state=${data}`;
    navigator.clipboard?.writeText(url);
    alert("Share link copied to clipboard.");
  };

  // Text export (simple): delegate to endpoint for download
  const exportTrip = () => {
    const data = encodeURIComponent(JSON.stringify(trip));
    window.open(`/api/export/pdf?state=${data}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2F2B25]">
      <main className="mx-auto max-w-[1200px] px-4 py-4">
        <div className="flex h-[calc(100vh-2rem)] rounded-2xl overflow-hidden border border-[#E5DFD0] shadow-lg">
          {panel}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#E5DFD0] bg-white">
              {tabs}
              <div className="flex items-center gap-2 text-sm">
                <div className="text-[#6B5F53]">Trip total:&nbsp;<span className="text-[#2F2B25]">${totalCost.toFixed(0)}</span></div>
                <button onClick={share} className="rounded-lg border border-[#E5DFD0] px-3 py-1 hover:bg-[#F5F1E8] text-[#2F2B25]">Share link</button>
                <button onClick={exportTrip} className="rounded-lg border border-[#E5DFD0] px-3 py-1 hover:bg-[#F5F1E8] text-[#2F2B25]">Export</button>
              </div>
            </div>
            <MapCanvas 
              center={{ lat: 40.7128, lng: -74.0060 }}
              zoom={12}
              onMapReady={handleMapClick}
              onAddWaypoint={handleAddWaypoint}
              onClearWaypoints={handleClearWaypoints}
            >
              <MarkersLayer 
                waypoints={waypoints}
                onMove={handleMarkerMove}
                onDelete={handleMarkerDelete}
              />
              <RouteLayer waypoints={waypoints} />
            </MapCanvas>
          </div>
        </div>
      </main>
    </div>
  );
}