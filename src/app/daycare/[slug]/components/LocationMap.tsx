"use client";

import { useEffect, useRef, useState } from "react";
import type { GoogleMap, GoogleMarker, GoogleGeocoder, GoogleInfoWindow } from "@/types/google-maps";

interface LocationMapProps {
  address: string;
  city: string;
  name?: string;
}

export default function LocationMap({ address, city, name }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const geocoderRef = useRef<GoogleGeocoder | null>(null);
  const infoWindowRef = useRef<GoogleInfoWindow | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "AIzaSyCe1aICpk2SmN3ArHwp-79FnsOk38k072M";

    if (!apiKey) {
      console.error("Google Maps API key is not configured");
      setError("Google Maps API key is not configured");
      return;
    }

    // Check if script is already loaded
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.Geocoder &&
      window.google.maps.Marker &&
      window.google.maps.Map
    ) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      // Script is already loading, wait for it
      const checkGoogle = setInterval(() => {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.Geocoder &&
          window.google.maps.Marker &&
          window.google.maps.Map
        ) {
          setIsScriptLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkGoogle);
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.Geocoder &&
          window.google.maps.Marker &&
          window.google.maps.Map
        ) {
          setIsScriptLoaded(true);
        }
      }, 10000);
      return;
    }

    // Load the script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait for Google Maps to be fully ready
      const checkReady = setInterval(() => {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.Geocoder &&
          window.google.maps.Marker &&
          window.google.maps.Map
        ) {
          setIsScriptLoaded(true);
          clearInterval(checkReady);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkReady);
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.Geocoder &&
          window.google.maps.Marker &&
          window.google.maps.Map
        ) {
          setIsScriptLoaded(true);
        }
      }, 10000);
    };
    script.onerror = () => {
      setError("Failed to load Google Maps");
    };
    document.head.appendChild(script);
  }, []);

  // Initialize map and geocode address
  useEffect(() => {
    if (
      !isScriptLoaded ||
      !mapRef.current ||
      !window.google ||
      !window.google.maps
    ) {
      return;
    }

    if (!mapInstanceRef.current) {
      // Initialize map
      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center: { lat: 43.6532, lng: -79.3832 }, // Default to Toronto
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        geocoderRef.current = new window.google.maps.Geocoder();
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Failed to initialize map");
        setIsLoading(false);
        return;
      }
    }

    // Geocode the address
    if (geocoderRef.current && address) {
      setIsLoading(true);
      const fullAddress = `${address}, ${city}, ON, Canada`;

      geocoderRef.current.geocode(
        { address: fullAddress },
        (results: unknown, status: string) => {
          setIsLoading(false);
          if (status === "OK" && results && Array.isArray(results) && results[0]) {
            const result = results[0] as { geometry: { location: { lat: () => number; lng: () => number } } };
            const location = result.geometry.location;
            const lat = location.lat();
            const lng = location.lng();

            // Center map on location
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setCenter({ lat, lng });
              mapInstanceRef.current.setZoom(15);

              // Remove existing marker
              if (markerRef.current) {
                markerRef.current.setMap(null);
              }

              // Create marker
              markerRef.current = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInstanceRef.current,
                title: name || address,
              });

              // Create info window
              if (infoWindowRef.current) {
                infoWindowRef.current.close();
              }

              const infoContent = `
                <div style="padding: 8px;">
                  <strong>${name || "Location"}</strong><br/>
                  <span>${address}</span><br/>
                  <span>${city}, ON</span>
                </div>
              `;

              infoWindowRef.current = new window.google.maps.InfoWindow({
                content: infoContent,
              });

              // Open info window by default
              if (markerRef.current) {
                infoWindowRef.current.open(
                  mapInstanceRef.current,
                  markerRef.current
                );

                // Add click listener to marker
                markerRef.current.addListener("click", () => {
                  if (mapInstanceRef.current && markerRef.current && infoWindowRef.current) {
                    infoWindowRef.current.open(
                      mapInstanceRef.current,
                      markerRef.current
                    );
                  }
                });
              }
            }
          } else {
            console.error("Geocoding failed:", status);
            setError("Could not find location");
          }
        }
      );
    }
  }, [isScriptLoaded, address, city, name]);

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-600 text-sm">
          {error}
        </div>
      )}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}


