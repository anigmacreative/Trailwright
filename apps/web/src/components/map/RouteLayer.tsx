// apps/web/src/components/map/RouteLayer.tsx
"use client";
import React, { useEffect, useMemo, useRef } from "react";

type LatLng = google.maps.LatLngLiteral;
type GMap = google.maps.Map;

interface RouteLayerProps {
  map?: GMap;
  waypoints: LatLng[];
  travelMode?: google.maps.TravelMode;
}

// Simple debounce implementation
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export default function RouteLayer({
  map,
  waypoints,
  travelMode = google.maps.TravelMode.DRIVING,
}: RouteLayerProps) {
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const serviceRef = useRef<google.maps.DirectionsService | null>(null);

  // init once
  useEffect(() => {
    if (!map || rendererRef.current) return;

    serviceRef.current = new google.maps.DirectionsService();
    rendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: "#D95D5D",     // muted red
        strokeOpacity: 0.9,
        strokeWeight: 5,
      },
    });
  }, [map]);

  // debounced routing
  const routeDebounced = useMemo(
    () =>
      debounce((wps: LatLng[]) => {
        if (!serviceRef.current || !rendererRef.current || wps.length < 2) return;
        const origin = wps[0];
        const destination = wps[wps.length - 1];
        const rest = wps.slice(1, -1).map((p) => ({ location: p, stopover: true }));

        serviceRef.current.route(
          {
            origin,
            destination,
            waypoints: rest,
            travelMode,
            optimizeWaypoints: false,
            // NOTE: for bike/walk, switch travelMode in parent
          },
          (res, status) => {
            if (status === google.maps.DirectionsStatus.OK && res) {
              rendererRef.current!.setDirections(res);
            } else {
              console.error("Directions request failed:", status);
            }
          }
        );
      }, 500),
    [travelMode]
  );

  useEffect(() => {
    if (!map) return;
    routeDebounced(waypoints);
  }, [map, waypoints, routeDebounced]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (routeDebounced.cancel) {
        routeDebounced.cancel();
      }
      rendererRef.current?.setMap(null as any);
      rendererRef.current = null;
      serviceRef.current = null;
    };
  }, [routeDebounced]);

  return null;
}