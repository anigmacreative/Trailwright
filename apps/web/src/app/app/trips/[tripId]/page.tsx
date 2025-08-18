"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/ui";
import { Plus, Settings, Share, Calendar, Zap, Download } from "lucide-react";
// Removed old map components - using only MapCanvas for baseline
import DayStrip from "@/components/trip/day-strip";
import ItineraryList from "@/components/trip/itinerary-list";
import { addPlaceToDay, listDayPlaces, movePlace, reorderDayPlaces, type DayPlace } from "@/lib/itinerary";

// Dynamic import for MapCanvas to avoid SSR issues
const MapCanvas = dynamic(() => import("@/components/map/MapCanvas"), { ssr: false });

interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  days: Array<{
    id: string;
    index: number;
    date: string;
  }>;
}

// Mock trip data - in real app this would come from Supabase
const mockTrip: Trip = {
  id: "demo-trip-1",
  title: "Iceland Volcano Trekking",
  startDate: "2024-06-15",
  endDate: "2024-06-22",
  days: [
    { id: "day-1", index: 0, date: "2024-06-15" },
    { id: "day-2", index: 1, date: "2024-06-16" },
    { id: "day-3", index: 2, date: "2024-06-17" },
  ],
};

export default function TripPage({ params }: { params: { tripId: string } }) {
  const [trip] = useState<Trip>(mockTrip);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [dayItems, setDayItems] = useState<DayPlace[]>([]);
  // Simplified state for baseline MapCanvas
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDay = trip.days[selectedDayIndex];
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load day items when day changes
  useEffect(() => {
    if (!selectedDay) return;

    const loadDayItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const items = await listDayPlaces({ dayId: selectedDay.id });
        setDayItems(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load day items");
        setDayItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDayItems();
  }, [selectedDay]);

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // Removed place selection handlers - MapCanvas handles its own interactions

  // Removed marker interaction handlers - MapCanvas is self-contained

  const handleOptimizeDay = async () => {
    if (dayItems.length < 2) return;

    setIsLoading(true);
    try {
      // TODO: Call FastAPI optimization endpoint
      const response = await fetch('/api/optimize-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: selectedDay.id,
          points: dayItems.map(item => ({ id: item.id, lat: item.lat, lng: item.lng })),
        }),
      });

      if (response.ok) {
        const { optimizedOrder } = await response.json();
        const success = await reorderDayPlaces(selectedDay.id, optimizedOrder);
        
        if (success) {
          // Reload day items to get updated order
          const items = await listDayPlaces({ dayId: selectedDay.id });
          setDayItems(items);
        }
      } else {
        throw new Error('Optimization failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Removed route handlers - MapCanvas handles its own routing

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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-clay/20 bg-bone p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">{trip.title}</h1>
            <p className="text-sm text-olive">
              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Day Strip */}
      <DayStrip
        days={trip.days.map(day => ({ index: day.index, date: day.date }))}
        selectedDayIndex={selectedDayIndex}
        onDaySelect={setSelectedDayIndex}
      />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Panel */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 relative">
            <MapCanvas
              initialCenter={{ lat: 64.1466, lng: -21.9426 }} // Default to Reykjavik
              initialZoom={10}
            />
          </div>
        </div>

        {/* Itinerary Panel */}
        <div className="w-96 border-l border-clay/20 bg-bone flex flex-col">
          <div className="border-b border-clay/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-semibold">
                Day {selectedDayIndex + 1}
              </h2>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOptimizeDay}
                  disabled={dayItems.length < 2 || isLoading}
                  title="Optimize Day"
                >
                  <Zap className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading}
                  title="Generate AI Plan"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-olive">
              {selectedDay && new Date(selectedDay.date).toLocaleDateString("en-US", { 
                weekday: "long", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-6 w-6 border-2 border-olive/30 border-t-olive rounded-full" />
              </div>
            ) : dayItems.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-olive/60 mb-4">No places added yet</p>
                <p className="text-sm text-olive/40">
                  Search for places above or click on the map to add them to your day.
                </p>
              </div>
            ) : (
              <ItineraryList
                places={dayItems.map(item => ({
                  id: item.id,
                  name: item.title,
                  lat: item.lat,
                  lng: item.lng,
                  address: item.formatted_address,
                  dayIndex: selectedDayIndex,
                  sortOrder: item.sort_order,
                }))}
                onPlaceClick={(place) => handleMarkerClick(place.id)}
                onReorder={(_, fromIndex, toIndex) => {
                  // Optimistic update
                  const newItems = [...dayItems];
                  const [moved] = newItems.splice(fromIndex, 1);
                  newItems.splice(toIndex, 0, moved);
                  setDayItems(newItems);
                  
                  // Update in database
                  const orderedIds = newItems.map(item => item.id);
                  reorderDayPlaces(selectedDay.id, orderedIds).catch(() => {
                    // Rollback on error
                    setDayItems(dayItems);
                    setError("Failed to reorder places");
                  });
                }}
                dayIndex={selectedDayIndex}
              />
            )}
          </div>

          {/* Comments Panel Stub */}
          <div className="border-t border-clay/20 p-4">
            <h3 className="text-sm font-medium text-olive/60 mb-2">Comments</h3>
            <p className="text-xs text-olive/40">Comments feature coming soon...</p>
          </div>
        </div>
      </div>

      {/* Place Drawer removed - MapCanvas is self-contained */}
    </div>
  );
}