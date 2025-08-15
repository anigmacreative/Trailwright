"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface MapCanvasProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMapLoad?: (map: google.maps.Map) => void;
  onPlaceClick?: (place: google.maps.places.PlaceResult) => void;
}

const MapCanvas: React.FC<MapCanvasProps> = ({
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 10,
  className = "",
  onMapLoad,
  onPlaceClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: "weekly",
          libraries: ["places", "geometry"],
        });

        await loader.load();

        if (!mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: [
            // Adventure-minimal map styling
            {
              featureType: "all",
              elementType: "labels.text.fill",
              stylers: [{ color: "#0D0D0C" }],
            },
            {
              featureType: "all",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#F5F2EB" }, { weight: 2 }],
            },
            {
              featureType: "administrative",
              elementType: "geometry.fill",
              stylers: [{ color: "#F5F2EB" }],
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#C7B9A5" }],
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#F5F2EB" }],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#C7B9A5" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#6C6B57" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#2E2E2B" }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
        });

        setMap(mapInstance);
        setIsLoaded(true);
        onMapLoad?.(mapInstance);

        // Add click handler for places
        if (onPlaceClick) {
          const service = new google.maps.places.PlacesService(mapInstance);
          
          mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              // Reverse geocode to get place info
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode(
                { location: event.latLng },
                (results, status) => {
                  if (status === "OK" && results?.[0]) {
                    // Get place details if available
                    const placeId = results[0].place_id;
                    if (placeId) {
                      service.getDetails(
                        { placeId },
                        (place, status) => {
                          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                            onPlaceClick(place);
                          }
                        }
                      );
                    } else {
                      // Create basic place result from geocode
                      onPlaceClick({
                        name: results[0].formatted_address,
                        geometry: {
                          location: event.latLng,
                        },
                        formatted_address: results[0].formatted_address,
                      } as google.maps.places.PlaceResult);
                    }
                  }
                }
              );
            }
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initMap();
  }, [center.lat, center.lng, zoom, onMapLoad, onPlaceClick]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="h-full w-full rounded-2xl" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-clay/10">
          <div className="text-olive">Loading map...</div>
        </div>
      )}
    </div>
  );
};

export default MapCanvas;