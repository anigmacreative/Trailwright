"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/ui";
import { Plus, Settings, Share, Calendar, Zap, Download } from "lucide-react";
import MapCanvas from "@/components/map/map-canvas";
import PlaceSearch from "@/components/map/place-search";
import PlaceDrawer from "@/components/map/place-drawer";
import MapMarkers from "@/components/map/map-markers";
import DayStrip from "@/components/trip/day-strip";
import ItineraryList from "@/components/trip/itinerary-list";

// Mock data structure
interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  dayIndex?: number;
  sortOrder?: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
  costCents?: number;
  tags?: string[];
}

interface Day {
  index: number;
  date: string;
  places: Place[];
}

interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  days: Day[];
}

// Mock trip data
const mockTrip: Trip = {
  id: "demo-trip-1",
  title: "Iceland Volcano Trekking",
  startDate: "2024-06-15",
  endDate: "2024-06-22",
  days: [
    {
      index: 0,
      date: "2024-06-15",
      places: [
        {
          id: "1",
          name: "Keflavik International Airport",
          lat: 63.985,
          lng: -22.6056,
          dayIndex: 0,
          sortOrder: 0,
          startTime: "14:00",
          endTime: "15:00",
          notes: "Arrival and car rental pickup",
        },
        {
          id: "2",
          name: "Blue Lagoon",
          lat: 63.8804,
          lng: -22.4495,
          dayIndex: 0,
          sortOrder: 1,
          startTime: "16:00",
          endTime: "19:00",
          notes: "Geothermal spa experience",
          costCents: 8500,
        },
        {
          id: "3",
          name: "Reykjavik Downtown",
          lat: 64.1466,
          lng: -21.9426,
          dayIndex: 0,
          sortOrder: 2,
          startTime: "20:00",
          endTime: "22:00",
          notes: "Check into hotel, evening exploration",
        },
      ],
    },
    {
      index: 1,
      date: "2024-06-16",
      places: [
        {
          id: "4",
          name: "Gullfoss Waterfall",
          lat: 64.3271,
          lng: -20.1218,
          dayIndex: 1,
          sortOrder: 0,
          startTime: "09:00",
          endTime: "11:00",
          notes: "Golden Circle - magnificent two-tiered waterfall",
        },
        {
          id: "5",
          name: "Geysir Geothermal Area",
          lat: 64.3107,
          lng: -20.3014,
          dayIndex: 1,
          sortOrder: 1,
          startTime: "11:30",
          endTime: "13:00",
          notes: "Watch Strokkur erupt every 5-10 minutes",
        },
      ],
    },
    {
      index: 2,
      date: "2024-06-17",
      places: [],
    },
  ],
};

export default function TripPage({ params }: { params: { tripId: string } }) {
  const [trip, setTrip] = useState<Trip>(mockTrip);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [isPlaceDrawerOpen, setIsPlaceDrawerOpen] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Get all places for map markers
  const allPlaces = trip.days.flatMap(day => day.places);

  // Get selected day places
  const selectedDay = trip.days[selectedDayIndex];
  const selectedDayPlaces = selectedDay?.places || [];

  // Get available days for adding places
  const availableDays = trip.days.map(day => ({
    index: day.index,
    date: day.date,
  }));

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place);
    setIsPlaceDrawerOpen(true);
  }, []);

  const handleAddToDay = useCallback((dayIndex: number) => {
    if (!selectedPlace?.geometry?.location) return;

    const newPlace: Place = {
      id: `place-${Date.now()}`,
      name: selectedPlace.name || "Unknown Place",
      lat: selectedPlace.geometry.location.lat(),
      lng: selectedPlace.geometry.location.lng(),
      address: selectedPlace.formatted_address,
      dayIndex,
      sortOrder: trip.days[dayIndex].places.length,
    };

    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.index === dayIndex
          ? { ...day, places: [...day.places, newPlace] }
          : day
      ),
    }));

    setIsPlaceDrawerOpen(false);
    setSelectedPlace(null);
  }, [selectedPlace, trip.days]);

  const handleDaySelect = useCallback((dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
  }, []);

  const handlePlaceClick = useCallback((place: Place) => {
    // Convert to Google Place format for drawer
    const googlePlace: google.maps.places.PlaceResult = {
      place_id: place.id,
      name: place.name,
      formatted_address: place.address,
      geometry: {
        location: new google.maps.LatLng(place.lat, place.lng),
      },
    };
    
    setSelectedPlace(googlePlace);
    setIsPlaceDrawerOpen(true);
  }, []);

  const handlePlaceReorder = useCallback((dayIndex: number, fromIndex: number, toIndex: number) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.index !== dayIndex) return day;
        
        const places = [...day.places];
        const [movedPlace] = places.splice(fromIndex, 1);
        places.splice(toIndex, 0, movedPlace);
        
        // Update sort order
        return {
          ...day,
          places: places.map((place, index) => ({
            ...place,
            sortOrder: index,
          })),
        };
      }),
    }));
  }, []);

  const handleOptimizeDay = async () => {
    // TODO: Call FastAPI optimization endpoint
    console.log("Optimizing day", selectedDayIndex);
  };

  const handleGenerateDayPlan = async () => {
    // TODO: Call AI generation endpoint
    console.log("Generating AI plan for day", selectedDayIndex);
  };

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
        days={availableDays}
        selectedDayIndex={selectedDayIndex}
        onDaySelect={handleDaySelect}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Panel */}
        <div className="flex flex-1 flex-col">
          <div className="border-b border-clay/20 p-4">
            <PlaceSearch
              onPlaceSelect={handlePlaceSelect}
              placeholder="Search for places to add..."
              className="max-w-md"
            />
          </div>
          
          <div className="flex-1 p-4">
            <MapCanvas
              className="h-full"
              onMapLoad={handleMapLoad}
              onPlaceClick={handlePlaceSelect}
            />
            <MapMarkers
              map={map}
              places={allPlaces}
              selectedDayIndex={selectedDayIndex}
              onMarkerClick={handlePlaceClick}
            />
          </div>
        </div>

        {/* Itinerary Panel */}
        <div className="w-96 border-l border-clay/20 bg-bone">
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
                  disabled={selectedDayPlaces.length < 2}
                >
                  <Zap className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGenerateDayPlan}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-olive">
              {new Date(selectedDay?.date).toLocaleDateString("en-US", { 
                weekday: "long", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
          </div>

          <ItineraryList
            places={selectedDayPlaces}
            onPlaceClick={handlePlaceClick}
            onReorder={handlePlaceReorder}
            dayIndex={selectedDayIndex}
          />
        </div>
      </div>

      {/* Place Drawer */}
      <PlaceDrawer
        place={selectedPlace}
        isOpen={isPlaceDrawerOpen}
        onClose={() => {
          setIsPlaceDrawerOpen(false);
          setSelectedPlace(null);
        }}
        onAddToDay={handleAddToDay}
        availableDays={availableDays}
      />
    </div>
  );
}