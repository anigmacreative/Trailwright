"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/ui";
import { Plus, Settings, Share, Calendar, Zap, Download } from "lucide-react";
import DayStrip from "@/components/trip/day-strip";
import ItineraryPanel from "@/components/itinerary/ItineraryPanel";
import { useItineraryState } from "@/state/itineraryStore";
import { createClient } from "@supabase/supabase-js";

// Dynamic imports for map components
const MapCanvas = dynamic(() => import("@/components/map/MapCanvas"), { ssr: false });
const MarkersLayer = dynamic(() => import("@/components/map/MarkersLayer"), { ssr: false });
const RouteLayer = dynamic(() => import("@/components/map/RouteLayer"), { ssr: false });

export default function TripPage({ params }: { params: { tripId: string } }) {
  const {
    trip, activeDay, setActiveDayIndex, addDay, removeDay,
    addStopToActiveDay, removeStop, reorderStops, setStopMeta,
    setRouteStats, replaceTrip, totalCost, activeDayCost,
  } = useItineraryState();

  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Convert stops to waypoints for the map components
  const waypoints: google.maps.LatLngLiteral[] = useMemo(() => {
    return activeDay.stops.map(stop => ({ lat: stop.lat, lng: stop.lng }));
  }, [activeDay.stops]);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load trip data from Supabase on mount
  useEffect(() => {
    const loadTripData = async () => {
      try {
        // Fetch trip with its days and places
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select(`
            *,
            days (
              *,
              day_places (
                *,
                places (*)
              )
            )
          `)
          .eq('id', params.tripId)
          .single();

        if (tripError) throw tripError;

        if (tripData) {
          // Transform Supabase data to store format
          const transformedTrip = {
            id: tripData.id,
            title: tripData.title,
            activeDayIndex: 0,
            days: tripData.days
              .sort((a: any, b: any) => a.index - b.index)
              .map((day: any) => ({
                id: day.id,
                title: `Day ${day.index + 1}`,
                stops: day.day_places
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((dp: any) => ({
                    id: dp.id,
                    title: dp.places.name,
                    lat: dp.places.lat,
                    lng: dp.places.lng,
                    note: dp.notes || '',
                    cost: dp.cost_cents ? dp.cost_cents / 100 : 0,
                  }))
              }))
          };

          replaceTrip(transformedTrip);
        }
      } catch (error) {
        console.error('Failed to load trip:', error);
      }
    };

    if (params.tripId) {
      loadTripData();
    }
  }, [params.tripId, supabase, replaceTrip]);

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

  // Share link: encode state in URL
  const share = () => {
    const data = encodeURIComponent(JSON.stringify(trip));
    const url = `${location.origin}/app/trips/${params.tripId}?state=${data}`;
    navigator.clipboard?.writeText(url);
    alert("Share link copied to clipboard.");
  };

  // Export trip to PDF
  const exportTrip = () => {
    const data = encodeURIComponent(JSON.stringify(trip));
    window.open(`/api/export/pdf?state=${data}`, "_blank");
  };

  // AI suggestions placeholder
  const handleAISuggestions = async () => {
    try {
      // TODO: Call FastAPI endpoint for AI suggestions
      const response = await fetch('/api/ai/suggest-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: params.tripId,
          dayIndex: trip.activeDayIndex,
          currentStops: activeDay.stops,
        }),
      });

      if (response.ok) {
        const suggestions = await response.json();
        // TODO: Process AI suggestions and update itinerary
        console.log('AI suggestions:', suggestions);
        alert('AI suggestions feature coming soon!');
      }
    } catch (error) {
      console.error('AI suggestions failed:', error);
      alert('AI suggestions feature coming soon!');
    }
  };

  // Optimize day route (placeholder)
  const handleOptimizeDay = () => {
    // TODO: Implement TSP optimization
    alert('Route optimization coming soon!');
  };

  if (!hasApiKey) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <h2 className="text-xl font-serif mb-4">Google Maps API Key Required</h2>
          <p className="text-olive/70 mb-4">
            To use the map features, please add your Google Maps API key to the environment variables.
          </p>
          <div className="text-left bg-clay/5 p-4 rounded-lg">
            <code className="text-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2F2B25]">
      <main className="mx-auto max-w-[1200px] px-4 py-4">
        <div className="flex h-[calc(100vh-2rem)] rounded-2xl overflow-hidden border border-[#E5DFD0] shadow-lg">
          <ItineraryPanel
            day={activeDay}
            dayIndex={trip.activeDayIndex}
            onRemoveStop={(id) => removeStop(id)}
            onReorderStops={(from, to) => {
              if (from < 0 || to < 0) return;
              reorderStops(from, to);
            }}
            onOptimize={handleOptimizeDay}
            onEditNote={(id, note) => setStopMeta(id, { note })}
            onEditCost={(id, cost) => setStopMeta(id, { cost })}
            activeDayCost={activeDayCost}
            distanceText={activeDay.distanceText}
            durationText={activeDay.durationText}
          />
          
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#E5DFD0] bg-white">
              {/* Day Tabs */}
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
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 text-sm">
                <div className="text-[#6B5F53]">Trip total:&nbsp;<span className="text-[#2F2B25]">${totalCost.toFixed(0)}</span></div>
                <button onClick={share} className="rounded-lg border border-[#E5DFD0] px-3 py-1 hover:bg-[#F5F1E8] text-[#2F2B25]">Share</button>
                <button onClick={exportTrip} className="rounded-lg border border-[#E5DFD0] px-3 py-1 hover:bg-[#F5F1E8] text-[#2F2B25]">Export</button>
                <button onClick={handleAISuggestions} className="rounded-lg border border-[#E5DFD0] px-3 py-1 hover:bg-[#F5F1E8] text-[#2F2B25]" title="AI Suggestions">🤖 AI</button>
                <button className="rounded-lg border border-[#E5DFD0] px-3 py-1 hover:bg-[#F5F1E8] text-[#2F2B25] opacity-50 cursor-not-allowed" title="Calendar view coming soon">📅</button>
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