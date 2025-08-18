export type ItineraryItem = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  notes?: string;
};

export function buildItinerary(items: ItineraryItem[]): ItineraryItem[] {
  // TODO: implement real logic
  return items;
}
