"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/ui";
import { 
  X, 
  Star, 
  Clock, 
  Phone, 
  Globe, 
  MapPin, 
  Plus,
  Camera 
} from "lucide-react";
import Image from "next/image";

interface PlaceDrawerProps {
  place: google.maps.places.PlaceResult | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToDay?: (dayIndex: number) => void;
  availableDays?: Array<{ index: number; date: string }>;
}

const PlaceDrawer: React.FC<PlaceDrawerProps> = ({
  place,
  isOpen,
  onClose,
  onAddToDay,
  availableDays = [],
}) => {
  if (!isOpen || !place) return null;

  const rating = place.rating;
  const photos = place.photos;
  const openingHours = place.opening_hours;

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/\s+/g, " ").trim();
  };

  const getPlaceTypes = () => {
    if (!place.types) return [];
    return place.types
      .filter(type => !type.includes("_"))
      .map(type => type.replace(/_/g, " "))
      .slice(0, 3);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 transform transition-transform">
      <div className="h-full overflow-y-auto bg-bone shadow-soft-lg">
        <Card className="h-full rounded-none border-0 shadow-none">
          <CardHeader className="border-b border-clay/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{place.name}</CardTitle>
                <p className="text-sm text-olive mt-1">
                  {place.formatted_address}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="ml-2 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Rating and basic info */}
            <div className="flex items-center gap-4 pt-2">
              {rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{rating}</span>
                  {place.user_ratings_total && (
                    <span className="text-sm text-olive">
                      ({place.user_ratings_total})
                    </span>
                  )}
                </div>
              )}
              
              {/* Place types */}
              <div className="flex gap-2">
                {getPlaceTypes().map((type, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-clay/20 px-2 py-1 text-xs text-olive"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Photos */}
            {photos && photos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Photos
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {photos.slice(0, 4).map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded-xl"
                    >
                      <Image
                        src={photo.getUrl({ maxWidth: 200, maxHeight: 200 })}
                        alt={`${place.name} photo ${index + 1}`}
                        width={200}
                        height={200}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opening hours */}
            {openingHours && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hours
                </h3>
                <div className="space-y-1">
                  {openingHours.weekday_text?.slice(0, 7).map((hours, index) => (
                    <div key={index} className="text-sm text-olive">
                      {hours}
                    </div>
                  ))}
                </div>
                {openingHours.isOpen !== undefined && (
                  <div className={`mt-2 text-sm font-medium ${
                    openingHours.isOpen() ? "text-green-600" : "text-red-600"
                  }`}>
                    {openingHours.isOpen() ? "Open now" : "Closed"}
                  </div>
                )}
              </div>
            )}

            {/* Contact info */}
            <div className="space-y-3">
              {place.international_phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-olive" />
                  <a
                    href={`tel:${place.international_phone_number}`}
                    className="text-sm hover:underline"
                  >
                    {formatPhoneNumber(place.international_phone_number)}
                  </a>
                </div>
              )}

              {place.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-olive" />
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                  >
                    Visit website
                  </a>
                </div>
              )}

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-olive" />
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  View on Google Maps
                </a>
              </div>
            </div>

            {/* Add to day buttons */}
            {onAddToDay && availableDays.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add to Day
                </h3>
                <div className="space-y-2">
                  {availableDays.map((day) => (
                    <Button
                      key={day.index}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => onAddToDay(day.index)}
                    >
                      Day {day.index + 1} - {new Date(day.date).toLocaleDateString()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlaceDrawer;