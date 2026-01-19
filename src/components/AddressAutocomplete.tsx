"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapPin } from "lucide-react";


interface AutocompleteInstance {
  getPlace: () => PlaceResult;
  addListener: (event: string, callback: () => void) => void;
}

// Google Maps types are now in @/types/google-maps.d.ts
// The Autocomplete type is already included in the global declaration

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface Geometry {
  location?: {
    lat: () => number;
    lng: () => number;
  };
  viewport?: unknown;
  [key: string]: unknown;
}

interface PlaceResult {
  formatted_address?: string;
  address_components?: AddressComponent[];
  geometry?: Geometry;
  place_id?: string;
  [key: string]: unknown;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter postal address or code",
  className = "",
  error,
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<AutocompleteInstance | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Google Maps script
  useEffect(() => {
    // Hardcoded API key for now
    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "AIzaSyCe1aICpk2SmN3ArHwp-79FnsOk38k072M";

    if (!apiKey) {
      console.error("Google Maps API key is not configured");
      return;
    }

    // Check if script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      // Script is loading, wait for it
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsScriptLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }

    // Load the script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait a bit to ensure Places library is fully initialized
      const checkPlaces = setInterval(() => {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.places &&
          window.google.maps.places.Autocomplete
        ) {
          clearInterval(checkPlaces);
          setIsScriptLoaded(true);
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkPlaces);
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsScriptLoaded(true);
        } else {
          console.error("Google Maps Places library failed to load");
        }
      }, 5000);
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts (optional)
      // Note: We might want to keep it for other components
    };
  }, []);

  // Initialize Autocomplete when script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current) {
      return;
    }

    // Function to initialize autocomplete once Places is ready
    const initializeAutocomplete = () => {
      if (!inputRef.current) {
        return;
      }

      // Wait for Google Maps and Places to be fully loaded
      if (
        !window.google ||
        !window.google.maps ||
        !window.google.maps.places ||
        !window.google.maps.places.Autocomplete
      ) {
        // If not loaded yet, wait a bit and try again
        const checkInterval = setInterval(() => {
          if (
            window.google &&
            window.google.maps &&
            window.google.maps.places &&
            window.google.maps.places.Autocomplete
          ) {
            clearInterval(checkInterval);
            initializeAutocomplete();
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (
            !window.google ||
            !window.google.maps ||
            !window.google.maps.places
          ) {
            console.error(
              "Google Maps Places library failed to load after 5 seconds"
            );
          }
        }, 5000);

        return;
      }

      try {
        // Initialize Autocomplete with Canada as default
        // componentRestrictions restricts results to Canada only
        // types: ['geocode'] allows both addresses and postal codes
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["geocode"], // Allows both addresses and postal codes
            componentRestrictions: { country: ["ca"] }, // Restrict to Canada only - this is the default
            fields: [
              "formatted_address",
              "address_components",
              "geometry",
              "place_id",
            ],
          }
        );

        autocompleteRef.current = autocomplete;

        // Handle place selection
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();

          if (place.formatted_address) {
            onChange(place.formatted_address);
            if (onPlaceSelect) {
              onPlaceSelect(place);
            }
          }
        });

        // Handle input changes manually (for manual typing)
        // Note: Google Places Autocomplete handles its own debouncing for suggestions
        // We only need to update the local state immediately for UI responsiveness
        const handleInputChange = (e: Event) => {
          const target = e.target as HTMLInputElement;
          setInputValue(target.value);
        };

        inputRef.current.addEventListener("input", handleInputChange);
      } catch (error) {
        console.error("Error initializing Google Places Autocomplete:", error);
      }
    };

    // Start initialization
    initializeAutocomplete();

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        try {
          window.google?.maps?.event?.clearInstanceListeners(
            autocompleteRef.current
          );
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [isScriptLoaded, onChange, onPlaceSelect]);

  // Debounced onChange handler - delays calling parent onChange until user stops typing
  const debouncedOnChange = useCallback(
    (newValue: string) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer to call onChange after 500ms of no typing
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, 500);
    },
    [onChange]
  );

  // Update local input value immediately for UI responsiveness
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  // Sync external value changes (e.g., from form reset)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
          } ${className}`}
          required={required}
          autoComplete="off"
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
