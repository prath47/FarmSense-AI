"use client";
import { useEffect } from "react";
import { useAppStore } from "./store";

export function useAutoLocation() {
  const { location, setLocation } = useAppStore();

  useEffect(() => {
    // Already have location — don't re-detect
    if (location) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json() as {
            address: { city?: string; town?: string; village?: string; state?: string; county?: string };
          };
          const addr = data.address;
          const city = addr.city ?? addr.town ?? addr.village ?? "Unknown";
          const region = addr.state ?? addr.county ?? "";
          setLocation({ lat, lon, city, region });
        } catch {
          // Fallback: store coords without name
          setLocation({ lat, lon, city: "Your location", region: "" });
        }
      },
      () => { /* user denied — silently skip */ },
      { timeout: 8000, maximumAge: 3600000 }
    );
  }, [location, setLocation]);
}
