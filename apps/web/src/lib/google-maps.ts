export type LatLng = { lat: number; lng: number };

export function getMapUrl(center: LatLng, zoom = 12): string {
  // TODO: swap in real Maps logic / API if needed
  const { lat, lng } = center;
  return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
}
