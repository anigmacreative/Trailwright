"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/ui";
import { Plus, Settings, Share, Calendar, Zap, Download } from "lucide-react";
import DayStrip from "@/components/trip/day-strip";
import ItineraryPanel from "@/components/itinerary/ItineraryPanel";
import { usePersistentItinerary } from "@/hooks/usePersistentItinerary";
import { supabase } from "@/lib/supabase";
import AISuggestionsModal from "@/components/ai/AISuggestionsModal";
import { AISuggestion, AISuggestionsResponse } from "@/types/ai";
import { OptimizeDayRequest, OptimizeDayResponse } from "@/types/optimization";
import { generateReorderMoves } from "@/utils/optimizationUtils";
import { ToastContainer } from "@/components/ui/Toast";

// Dynamic imports for map components
const MapCanvas = dynamic(() => import("@/components/map/MapCanvas"), { ssr: false });
const MarkersLayer = dynamic(() => import("@/components/map/MarkersLayer"), { ssr: false });
const RouteLayer = dynamic(() => import("@/components/map/RouteLayer"), { ssr: false });

export default function TripPage({ params }: { params: { tripId: string } }) {
  const {
    trip, activeDay, setActiveDayIndex, addDay, removeDay,
    addStopToActiveDay, removeStop, reorderStops, setStopMeta,
    setRouteStats, replaceTrip, totalCost, activeDayCost,
    notifications, addNotification, dismissNotification, optimizeDay,
  } = usePersistentItinerary();

  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [error, setError] = React.useState<string | null>(null);
  
  // AI suggestions modal state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [aiReasoning, setAIReasoning] = useState<string>("");
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string>("");
  
  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string>("");

  // Convert stops to waypoints for the map components
  const waypoints: google.maps.LatLngLiteral[] = useMemo(() => {
    return activeDay.stops.map(stop => ({ lat: stop.lat, lng: stop.lng }));
  }, [activeDay.stops]);

  // Memoize map center to prevent unnecessary re-renders
  const mapCenter = useMemo(() => ({ lat: 40.7128, lng: -74.0060 }), []);


  // Load trip data from Supabase on mount
  useEffect(() => {
    const loadTripData = async () => {
      try {
        setError(null);
        
        // Try public API first for anonymous access
        try {
          const response = await fetch(`/api/public-trip/${params.tripId}`);
          if (response.ok) {
            const { trip: tripData } = await response.json();
            console.log('✅ Loaded trip via public API');
            replaceTrip(tripData);
            return;
          }
        } catch (publicError) {
          console.log('Public API failed, trying authenticated access...', publicError);
          addNotification({
            type: 'info',
            title: 'Loading from backup source',
            message: 'Primary API unavailable, loading from authenticated source...',
            duration: 3000,
          });
        }
        
        // Fallback to authenticated Supabase access
        const useShareId = process.env.NEXT_PUBLIC_USE_SHARE_ID !== 'false';
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
          .eq(useShareId ? 'share_id' : 'id', params.tripId)
          .single();

        if (tripError) {
          console.error('Trip load error:', tripError);
          let errorMessage = 'We couldn\'t load this trip. Please refresh or try again later.';
          let errorTitle = 'Loading Failed';
          
          if (tripError.code === 'PGRST116') {
            errorMessage = 'Trip not found. This trip may be private or the URL may be incorrect.';
            errorTitle = 'Trip Not Found';
          }
          
          setError(errorMessage);
          addNotification({
            type: 'error',
            title: errorTitle,
            message: errorMessage,
            duration: 6000,
            action: {
              label: 'Retry',
              onClick: () => window.location.reload(),
            }
          });
          return;
        }

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
      } catch (error: unknown) {
        console.error('Failed to load trip:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const errorMessage = `We couldn't load this trip: ${message}. Please refresh or pick another trip.`;
        setError(errorMessage);
        
        addNotification({
          type: 'error',
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your connection and try again.',
          duration: 8000,
          action: {
            label: 'Retry',
            onClick: () => window.location.reload(),
          }
        });
      }
    };

    if (params.tripId) {
      loadTripData();
    }
  }, [params.tripId, replaceTrip, addNotification]);

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
    try {
      const data = encodeURIComponent(JSON.stringify(trip));
      const url = `${location.origin}/app/trips/${params.tripId}?state=${data}`;
      navigator.clipboard?.writeText(url);
      
      addNotification({
        type: 'success',
        title: 'Share Link Copied',
        message: 'The trip share link has been copied to your clipboard.',
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: 'error', 
        title: 'Copy Failed',
        message: 'Failed to copy share link to clipboard.',
        duration: 5000,
      });
    }
  };

  // Export trip to PDF
  const exportTrip = () => {
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (demoMode) {
      addNotification({
        type: 'info',
        title: 'Export Coming Soon',
        message: 'Export functionality will be available soon. Stay tuned!',
        duration: 4000,
      });
      return;
    }
    
    try {
      const data = encodeURIComponent(JSON.stringify(trip));
      window.open(`/api/export/pdf?state=${data}`, "_blank");
      
      addNotification({
        type: 'success',
        title: 'Export Started',
        message: 'Your trip export is being prepared...',
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Unable to export trip. Please try again.',
        duration: 5000,
      });
    }
  };

  // AI suggestions handler
  const handleAISuggestions = async () => {
    const enableAI = process.env.NEXT_PUBLIC_ENABLE_AI !== 'false';
    if (!enableAI) {
      addNotification({
        type: 'info',
        title: 'Feature Disabled',
        message: 'AI suggestions are currently disabled.',
        duration: 4000,
      });
      return;
    }

    setShowAIModal(true);
    setAILoading(true);
    setAIError("");
    setAISuggestions([]);
    setAIReasoning("");

    try {
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
        const data: AISuggestionsResponse = await response.json();
        setAISuggestions(data.suggestions || []);
        setAIReasoning(data.reasoning || "");
      } else {
        const errorData = await response.json();
        setAIError(errorData.error || `Request failed with status ${response.status}`);
      }
    } catch (error: unknown) {
      let message = 'Network error or server unavailable';
      if (error instanceof Error) {
        message = error.message;
      }
      setAIError(message);
      
      addNotification({
        type: 'error',
        title: 'AI Suggestions Failed',
        message: 'Unable to fetch AI suggestions. Please check your connection and try again.',
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: handleAISuggestions,
        }
      });
    } finally {
      setAILoading(false);
    }
  };

  // Handle adding AI suggestion to day
  const handleAddAISuggestion = useCallback((suggestion: AISuggestion) => {
    // If suggestion has coordinates, use them; otherwise use a default location
    const lat = suggestion.lat || 40.7128; // Default to NYC
    const lng = suggestion.lng || -74.0060;
    
    addStopToActiveDay({
      title: suggestion.name,
      lat,
      lng,
      note: `${suggestion.description} (${suggestion.category}, ~${suggestion.estimated_duration}min)`,
    });
  }, [addStopToActiveDay]);

  // Optimize day route using TSP algorithm
  const handleOptimizeDay = useCallback(async () => {
    const enableOptimize = process.env.NEXT_PUBLIC_ENABLE_OPTIMIZE !== 'false';
    if (!enableOptimize) {
      addNotification({
        type: 'info',
        title: 'Feature Disabled',
        message: 'Route optimization is currently disabled.',
        duration: 4000,
      });
      return;
    }

    if (activeDay.stops.length < 3) {
      addNotification({
        type: 'warning',
        title: 'More Stops Needed',
        message: 'Add at least 3 stops to optimize the route.',
        duration: 4000,
      });
      return;
    }

    setIsOptimizing(true);
    setOptimizeError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const optimizeRequest: OptimizeDayRequest = {
        places: activeDay.stops.map(stop => ({
          id: stop.id,
          lat: stop.lat,
          lng: stop.lng,
          name: stop.title,
        })),
        travel_mode: 'DRIVING', // Could be made configurable
      };

      const response = await fetch(`${backendUrl}/optimize-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizeRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Optimization failed with status ${response.status}`);
      }

      const result: OptimizeDayResponse = await response.json();
      
      // Apply optimization with persistence
      const success = await optimizeDay(result.order);
      
      if (success) {
        // Show success feedback
        addNotification({
          type: 'success',
          title: 'Route Optimized!',
          message: `Total distance: ${result.total_distance.toFixed(1)}km, Total time: ${Math.round(result.total_duration / 60)}min`,
          duration: 5000,
        });
      }
      // Error handling is done by optimizeDay function

    } catch (error: unknown) {
      let message = 'Route optimization failed';
      if (error instanceof Error) {
        message = error.message;
      }
      setOptimizeError(message);
      
      addNotification({
        type: 'error',
        title: 'Optimization Failed',
        message: 'Unable to optimize route. Please check your connection and try again.',
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: handleOptimizeDay,
        }
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [activeDay.stops, optimizeDay, addNotification]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <h2 className="text-xl font-serif mb-4">Trip Loading Error</h2>
          <p className="text-[#6B5F53] mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="rounded-lg border border-[#E5DFD0] px-4 py-2 hover:bg-[#F5F1E8] text-[#2F2B25]"
            >
              Refresh Page
            </button>
            <Link 
              href="/app/trips" 
              className="rounded-lg border border-[#E5DFD0] px-4 py-2 hover:bg-[#F5F1E8] text-[#2F2B25]"
            >
              Back to Trips
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? (
                  <button onClick={exportTrip} className="rounded-lg border border-[#E5DFD0] px-3 py-1 text-[#2F2B25] opacity-75 hover:bg-[#F5F1E8]" title="Export coming soon">Export</button>
                ) : (
                  <button onClick={exportTrip} className="rounded-lg border border-[#E5DFD0] px-3 py-1 hover:bg-[#F5F1E8] text-[#2F2B25]">Export</button>
                )}
                {process.env.NEXT_PUBLIC_ENABLE_AI !== 'false' ? (
                  <button onClick={handleAISuggestions} className="rounded-lg border border-[#E5DFD0] px-3 py-1 hover:bg-[#F5F1E8] text-[#2F2B25]" title="AI Suggestions">🤖 AI</button>
                ) : (
                  <button className="rounded-lg border border-[#E5DFD0] px-3 py-1 text-[#2F2B25] opacity-50 cursor-not-allowed" title="AI suggestions are disabled">🤖 AI</button>
                )}
                <button className="rounded-lg border border-[#E5DFD0] px-3 py-1 hover:bg-[#F5F1E8] text-[#2F2B25] opacity-50 cursor-not-allowed" title="Calendar view coming soon">📅</button>
              </div>
            </div>
            
            <MapCanvas 
              center={mapCenter}
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

      {/* Toast Notifications */}
      <ToastContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* AI Suggestions Modal */}
      <AISuggestionsModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        suggestions={aiSuggestions}
        reasoning={aiReasoning}
        isLoading={aiLoading}
        error={aiError}
        onAddSuggestion={handleAddAISuggestion}
      />
    </div>
  );
}