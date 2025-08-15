"use client";

import React from "react";
import { Card, CardContent } from "@/ui";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  StickyNote, 
  GripVertical,
  MoreHorizontal 
} from "lucide-react";

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  dayIndex?: number;
  sortOrder?: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
  costCents?: number;
  tags?: string[];
}

interface ItineraryListProps {
  places: Place[];
  onPlaceClick?: (place: Place) => void;
  onReorder?: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  dayIndex: number;
}

const ItineraryList: React.FC<ItineraryListProps> = ({
  places,
  onPlaceClick,
  onReorder,
  dayIndex,
}) => {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatTime = (time: string) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (places.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-clay mb-4" />
          <h3 className="font-semibold text-lg mb-2">No places yet</h3>
          <p className="text-olive text-sm">
            Search for places or click on the map to add them to this day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {places.map((place, index) => (
        <Card
          key={place.id}
          className="cursor-pointer transition-all hover:shadow-soft group"
          onClick={() => onPlaceClick?.(place)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Drag Handle */}
              <div className="flex flex-col items-center mt-1">
                <GripVertical className="h-4 w-4 text-clay opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-6 h-6 rounded-full bg-olive text-bone text-xs flex items-center justify-center font-semibold mt-1">
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-ink truncate group-hover:text-olive transition-colors">
                  {place.name}
                </h4>
                
                {place.address && (
                  <p className="text-sm text-olive truncate mt-1">
                    {place.address}
                  </p>
                )}

                {/* Time */}
                {(place.startTime || place.endTime) && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-olive">
                    <Clock className="h-3 w-3" />
                    <span>
                      {place.startTime && formatTime(place.startTime)}
                      {place.startTime && place.endTime && " - "}
                      {place.endTime && formatTime(place.endTime)}
                    </span>
                  </div>
                )}

                {/* Cost */}
                {place.costCents && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-olive">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCurrency(place.costCents)}</span>
                  </div>
                )}

                {/* Notes */}
                {place.notes && (
                  <div className="flex items-start gap-1 mt-2 text-sm">
                    <StickyNote className="h-3 w-3 mt-0.5 flex-shrink-0 text-olive" />
                    <p className="text-olive line-clamp-2">{place.notes}</p>
                  </div>
                )}

                {/* Tags */}
                {place.tags && place.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {place.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-block px-2 py-1 text-xs bg-clay/20 text-olive rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {place.tags.length > 3 && (
                      <span className="inline-block px-2 py-1 text-xs bg-clay/20 text-olive rounded-full">
                        +{place.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-clay/10">
                  <MoreHorizontal className="h-4 w-4 text-olive" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Day Summary */}
      <Card className="mt-4 bg-clay/5 border-clay/20">
        <CardContent className="p-4">
          <div className="text-sm text-olive space-y-1">
            <div className="flex justify-between">
              <span>Total places:</span>
              <span className="font-medium">{places.length}</span>
            </div>
            
            {places.some(p => p.costCents) && (
              <div className="flex justify-between">
                <span>Estimated cost:</span>
                <span className="font-medium">
                  {formatCurrency(
                    places.reduce((sum, p) => sum + (p.costCents || 0), 0)
                  )}
                </span>
              </div>
            )}

            {places.some(p => p.startTime && p.endTime) && (
              <div className="flex justify-between">
                <span>Planned duration:</span>
                <span className="font-medium">
                  {/* Calculate total duration */}
                  {(() => {
                    const validTimes = places.filter(p => p.startTime && p.endTime);
                    if (validTimes.length === 0) return "—";
                    
                    const firstStart = validTimes.reduce((earliest, p) => 
                      p.startTime! < earliest ? p.startTime! : earliest, validTimes[0].startTime!
                    );
                    const lastEnd = validTimes.reduce((latest, p) => 
                      p.endTime! > latest ? p.endTime! : latest, validTimes[0].endTime!
                    );
                    
                    const start = new Date(`2024-01-01T${firstStart}`);
                    const end = new Date(`2024-01-01T${lastEnd}`);
                    const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                    
                    return `~${hours}h`;
                  })()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItineraryList;