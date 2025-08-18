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

export function listDayPlaces(dayId: string): DayPlace[] {
  // TODO: implement real logic
  return [];
}

export function movePlace(placeId: string, newDayId: string): void {
  // TODO: implement real logic
}

export function reorderDayPlaces(dayId: string, placeIds: string[]): void {
  // TODO: implement real logic
}
