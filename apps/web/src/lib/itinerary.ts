export type ItineraryItem = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  notes?: string;
};

export type DayPlace = {
  id: string;
  name: string;
  dayId: string;
  order: number;
  lat: number;
  lng: number;
};

export function buildItinerary(items: ItineraryItem[]): ItineraryItem[] {
  // TODO: implement real logic
  return items;
}

export function addPlaceToDay(dayId: string, place: Omit<DayPlace, 'id' | 'dayId' | 'order'>): DayPlace {
  // TODO: implement real logic
  return {
    id: `place_${Date.now()}`,
    dayId,
    order: 0,
    ...place,
  };
}

export function listDayPlaces(params: { dayId: string }): Promise<DayPlace[]> {
  // TODO: implement real logic
  return Promise.resolve([]);
}

export function movePlace(placeId: string, newDayId: string): void {
  // TODO: implement real logic
}

/**
 * Reorder places within a day.  Returns a boolean indicating success so
 * consumers can decide whether to refresh the list.
 */
export async function reorderDayPlaces(dayId: string, placeIds: string[]): Promise<boolean> {
  // TODO: replace this mock implementation with real logic.
  return true;
}
