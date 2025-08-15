"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/ui";
import { Search, MapPin, Clock, Star } from "lucide-react";

interface PlaceSearchProps {
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  types?: string[];
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({
  onPlaceSelect,
  placeholder = "Search for places...",
  className = "",
  types = ["establishment"],
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const initAutocomplete = async () => {
      if (!window.google || !inputRef.current) return;

      const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
        types,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "geometry",
          "photos",
          "rating",
          "user_ratings_total",
          "opening_hours",
          "website",
          "international_phone_number",
          "types",
        ],
      });

      autocompleteInstance.addListener("place_changed", () => {
        const place = autocompleteInstance.getPlace();
        if (place && place.geometry) {
          onPlaceSelect?.(place);
          setIsOpen(false);
          setPredictions([]);
        }
      });

      setAutocomplete(autocompleteInstance);
    };

    // Wait for Google Maps to load
    const checkGoogleMaps = () => {
      if (window.google?.maps?.places) {
        initAutocomplete();
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };

    checkGoogleMaps();

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [autocomplete, onPlaceSelect, types]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (!value.trim()) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    if (window.google?.maps?.places) {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: value,
          types,
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
            setIsOpen(true);
            setSelectedIndex(-1);
          } else {
            setPredictions([]);
            setIsOpen(false);
          }
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev < predictions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handlePredictionSelect(predictions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!window.google?.maps?.places) return;

    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    );

    service.getDetails(
      {
        placeId: prediction.place_id,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "geometry",
          "photos",
          "rating",
          "user_ratings_total",
          "opening_hours",
          "website",
          "international_phone_number",
          "types",
        ],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          onPlaceSelect?.(place);
          if (inputRef.current) {
            inputRef.current.value = place.name || "";
          }
          setIsOpen(false);
          setPredictions([]);
        }
      }
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-olive" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="pl-10"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          onBlur={() => {
            // Delay hiding to allow clicking on predictions
            setTimeout(() => setIsOpen(false), 200);
          }}
        />
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-2xl border border-clay/20 bg-bone shadow-soft-lg">
          <div className="max-h-64 overflow-y-auto">
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id}
                className={`flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-clay/5 ${
                  index === selectedIndex ? "bg-clay/10" : ""
                } ${index === 0 ? "rounded-t-2xl" : ""} ${
                  index === predictions.length - 1 ? "rounded-b-2xl" : ""
                }`}
                onClick={() => handlePredictionSelect(prediction)}
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-olive" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-olive">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceSearch;