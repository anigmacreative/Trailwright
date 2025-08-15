"use client";

import React, { useEffect, useState } from "react";

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dayIndex?: number;
  sortOrder?: number;
}

interface MapMarkersProps {
  map: google.maps.Map | null;
  places: Place[];
  onMarkerClick?: (place: Place) => void;
  selectedDayIndex?: number;
}

const dayColors = [
  "#FF6B6B", // Day 1 - Red
  "#4ECDC4", // Day 2 - Teal
  "#45B7D1", // Day 3 - Blue
  "#96CEB4", // Day 4 - Green
  "#FFEAA7", // Day 5 - Yellow
  "#DDA0DD", // Day 6 - Purple
  "#98D8C8", // Day 7 - Mint
  "#F7DC6F", // Day 8 - Gold
  "#BB8FCE", // Day 9 - Lavender
  "#85C1E9", // Day 10 - Light Blue
];

const MapMarkers: React.FC<MapMarkersProps> = ({
  map,
  places,
  onMarkerClick,
  selectedDayIndex,
}) => {
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers and polylines
    markers.forEach(marker => marker.setMap(null));
    polylines.forEach(polyline => polyline.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const newPolylines: google.maps.Polyline[] = [];

    // Group places by day
    const placesByDay = places.reduce((acc, place) => {
      const dayIndex = place.dayIndex ?? -1;
      if (!acc[dayIndex]) acc[dayIndex] = [];
      acc[dayIndex].push(place);
      return acc;
    }, {} as Record<number, Place[]>);

    // Create markers for each day
    Object.entries(placesByDay).forEach(([dayIndex, dayPlaces]) => {
      const dayNum = parseInt(dayIndex);
      const isSelectedDay = selectedDayIndex === undefined || selectedDayIndex === dayNum;
      const dayColor = dayNum >= 0 ? dayColors[dayNum % dayColors.length] : "#6C6B57";

      // Sort places by sort order
      const sortedPlaces = [...dayPlaces].sort((a, b) => 
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );

      sortedPlaces.forEach((place, index) => {
        // Create custom marker icon
        const icon = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelectedDay ? 10 : 6,
          fillColor: dayColor,
          fillOpacity: isSelectedDay ? 1 : 0.6,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        };

        const marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map,
          icon,
          title: place.name,
          zIndex: isSelectedDay ? 1000 : 100,
        });

        // Add click listener
        marker.addListener("click", () => {
          onMarkerClick?.(place);
        });

        // Add number label for order
        if (isSelectedDay && dayNum >= 0) {
          const label = new google.maps.Marker({
            position: { lat: place.lat, lng: place.lng },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0,
            },
            label: {
              text: String(index + 1),
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "bold",
            },
            zIndex: 1001,
          });

          newMarkers.push(label);
        }

        newMarkers.push(marker);
      });

      // Create polyline for day route
      if (isSelectedDay && sortedPlaces.length > 1 && dayNum >= 0) {
        const path = sortedPlaces.map(place => ({
          lat: place.lat,
          lng: place.lng,
        }));

        const polyline = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: dayColor,
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map,
          zIndex: 50,
        });

        newPolylines.push(polyline);
      }
    });

    setMarkers(newMarkers);
    setPolylines(newPolylines);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      places.forEach(place => {
        bounds.extend({ lat: place.lat, lng: place.lng });
      });
      
      // Only fit bounds if we have multiple places
      if (places.length > 1) {
        map.fitBounds(bounds);
      } else if (places.length === 1) {
        map.setCenter({ lat: places[0].lat, lng: places[0].lng });
        map.setZoom(15);
      }
    }
  }, [map, places, selectedDayIndex, onMarkerClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markers.forEach(marker => marker.setMap(null));
      polylines.forEach(polyline => polyline.setMap(null));
    };
  }, []);

  return null; // This component doesn't render anything
};

export default MapMarkers;