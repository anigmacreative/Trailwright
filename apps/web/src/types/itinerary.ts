export type LatLng = { lat: number; lng: number };

export type Stop = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  note?: string;
  cost?: number; // USD for MVP
  markerId?: string; // internal link to map marker
  // Database IDs for persistence
  dayPlaceId?: string; // day_places.id
  placeId?: string; // places.id
};

export type DayPlan = {
  id: string;
  title: string; // e.g., "Day 1"
  stops: Stop[];
  distanceText?: string;
  durationText?: string;
};

export type TripDraft = {
  id: string;
  title: string;
  days: DayPlan[];
  activeDayIndex: number;
};