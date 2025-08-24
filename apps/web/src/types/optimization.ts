export interface OptimizationPlace {
  id: string;
  lat: number;
  lng: number;
  name?: string;
}

export interface OptimizeDayRequest {
  places: OptimizationPlace[];
  travel_mode: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
}

export interface OptimizeDayResponse {
  order: string[];
  distances: number[];
  durations: number[];
  total_distance: number;
  total_duration: number;
}

export interface OptimizationError {
  error: string;
  details?: string;
}