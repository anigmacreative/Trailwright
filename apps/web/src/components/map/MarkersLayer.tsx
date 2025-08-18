// apps/web/src/components/map/MarkersLayer.tsx
"use client";
import React, { useEffect, useRef } from "react";
import { getLoader } from "@/lib/google-maps";

type LatLng = google.maps.LatLngLiteral;
type GMap = google.maps.Map;

interface MarkersLayerProps {
  map?: GMap;
  waypoints: LatLng[];
  onMove?: (index: number, pos: LatLng) => void;
  onDelete?: (index: number) => void;
}

export default function MarkersLayer({ map, waypoints, onMove, onDelete }: MarkersLayerProps) {
  const markersRef = useRef<(google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]>([]);

  // create/refresh markers ONLY when waypoints change
  useEffect(() => {
    if (!map) return;

    (async () => {
      await getLoader().load();
      
      // Clear existing
      markersRef.current.forEach(m => {
        if ('map' in m) {
          (m as any).map = null;
        } else {
          (m as google.maps.Marker).setMap(null);
        }
      });
      markersRef.current = [];

      const hasMapId = !!(map as any).getMapId?.();

      waypoints.forEach((pos, i) => {
        if (hasMapId) {
          // Use AdvancedMarkerElement when Map ID is available
          try {
            const { marker } = (google.maps as any);
            const m = new marker.AdvancedMarkerElement({
              map,
              position: pos,
              title: `Waypoint ${i + 1}`,
            });

            const drag = new google.maps.marker.PinElement({
              background: "#D95D5D", // muted red
              borderColor: "#8F3C3C",
              glyphColor: "#fff",
            });
            (m as any).content = drag.element;

            // Delete via right-click or "Alt/Option" click
            m.addListener?.("gmp-rightclick", () => onDelete?.(i));
            m.addListener?.("gmp-click", (ev: any) => {
              if (ev.domEvent?.altKey || ev.domEvent?.metaKey) onDelete?.(i);
            });

            markersRef.current.push(m);
          } catch (error) {
            console.warn("AdvancedMarkerElement not available, falling back to regular Marker");
            // Fallback to regular marker
            createRegularMarker(pos, i);
          }
        } else {
          // Fallback to regular Google Maps Marker
          createRegularMarker(pos, i);
        }
      });

      function createRegularMarker(pos: LatLng, i: number) {
        const m = new google.maps.Marker({
          map,
          position: pos,
          title: `Waypoint ${i + 1}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#D95D5D",
            fillOpacity: 1,
            strokeColor: "#8F3C3C",
            strokeWeight: 2,
          },
        });

        // Delete via right-click
        m.addListener("rightclick", () => onDelete?.(i));

        markersRef.current.push(m);
      }
    })();
  }, [map, waypoints, onMove, onDelete]);

  return null;
}