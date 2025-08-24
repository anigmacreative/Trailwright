import { Loader } from '@googlemaps/js-api-loader';

/**
 * Lazily creates a single instance of the Google Maps JS API loader.
 * You must set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
 */
let loader: Loader | null = null;
let apiKeyMissing = false;

export function getLoader(): Loader | null {
  if (!loader && !apiKeyMissing) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      apiKeyMissing = true;
      console.warn('🗺️ Google Maps API key missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable maps.');
      return null;
    }
    loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'marker'],
    });
  }
  return loader;
}

/**
 * Loads the Maps API libraries you need (places and marker).  Calling this
 * function multiple times will reuse the cached loader.
 * Returns false if API key is missing, true if successful.
 */
export async function loadMaps(): Promise<boolean> {
  const ldr = getLoader();
  if (!ldr) {
    return false; // API key missing
  }
  try {
    await ldr.load();
    await ldr.importLibrary('places');
    await ldr.importLibrary('marker');
    return true;
  } catch (error: unknown) {
    console.error('🗺️ Failed to load Google Maps:', error);
    return false;
  }
}

/**
 * Custom pastel map style used throughout Trailwright.  Derived from the
 * "Pastel" theme on Snazzy Maps.
 */
export const TRAILWRIGHT_PASTEL_STYLE: google.maps.MapTypeStyle[] = [
  {
    featureType: 'administrative',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [
      { visibility: 'on' },
      { lightness: 85 },
      { saturation: 100 },
      { gamma: 1 },
    ],
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      { visibility: 'on' },
      { saturation: 100 },
      { lightness: 9 },
      { color: '#f2558a' },
    ],
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
];