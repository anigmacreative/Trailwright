export interface AISuggestion {
  name: string;
  description: string;
  category: string;
  estimated_duration: number; // minutes
  lat?: number;
  lng?: number;
  google_place_id?: string;
}

export interface AISuggestionsResponse {
  suggestions: AISuggestion[];
  reasoning: string;
}

export interface AISuggestionsError {
  error: string;
  details?: string;
}

// Request types
export interface AISuggestRequest {
  tripId: string;
  dayIndex: number;
  currentStops: Array<{
    id: string;
    title: string;
    lat: number;
    lng: number;
    note?: string;
    cost?: number;
  }>;
}