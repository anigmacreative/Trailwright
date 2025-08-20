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
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T & { cancel?: () => void } {
  let timeoutId: NodeJS.Timeout;
  const debounced = ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel?: () => void };
  
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

export default function RouteLayer({
  map,
  waypoints,
  travelMode = google.maps.TravelMode.DRIVING,
}: RouteLayerProps) {
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const serviceRef = useRef<google.maps.DirectionsService | null>(null);
  const requestIdRef = useRef<number>(0);

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

  // debounced routing with request ID to drop stale responses
  const routeDebounced = useMemo(
    () =>
      debounce((wps: LatLng[]) => {
        if (!serviceRef.current || !rendererRef.current) return;

        // Clear route if fewer than 2 waypoints
        if (wps.length < 2) {
          rendererRef.current.setMap(null);
          return;
        }

        // Increment request ID for this request
        const currentRequestId = ++requestIdRef.current;
        
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
            // Drop stale responses
            if (currentRequestId !== requestIdRef.current) return;
            
            if (status === google.maps.DirectionsStatus.OK && res) {
              rendererRef.current!.setMap(map!);
              rendererRef.current!.setDirections(res);
            } else {
              console.error("Directions request failed:", status);
            }
          }
        );
      }, 500),
    [travelMode, map]
  );

  // Create stable dependency string from waypoint coordinates
  const coordsString = useMemo(() => 
    JSON.stringify(waypoints.map(w => [w.lat, w.lng])), 
    [waypoints]
  );

  // Use deep dependency to trigger on coordinate changes
  useEffect(() => {
    if (!map) return;
    
    routeDebounced(waypoints);
    
    // Cleanup function to cancel pending debounced calls
    return () => {
      if (routeDebounced.cancel) {
        routeDebounced.cancel();
      }
    };
  }, [map, coordsString, routeDebounced]);

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