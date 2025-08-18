// Muted earth-tone map style: light water, darker land, soft roads/labels.
export const EARTH_TONES_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#F5F2EB" }] }, // ivory water
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6C6B57" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#2E2E2B" }] }, // near-black land
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#E6E2D6" }] }, // muted greens
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#C7B9A5" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#2E2E2B" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6C6B57" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#BFB7A6" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] }
];