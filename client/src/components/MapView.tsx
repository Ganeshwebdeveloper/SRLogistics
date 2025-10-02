import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as L from "leaflet";

interface MapViewProps {
  drivers?: Array<{
    id: string;
    name: string;
    position: [number, number];
    truckNumber: string;
  }>;
}

export function MapView({ drivers = [] }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([40.7128, -74.0060], 12);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    drivers.forEach((driver) => {
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold border-2 border-background shadow-lg">
              ${driver.truckNumber}
            </div>
            <div class="mt-1 bg-background/90 px-2 py-1 rounded text-xs font-medium border border-border">
              ${driver.name}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker(driver.position, { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <strong>${driver.name}</strong><br/>
            Truck: ${driver.truckNumber}
          </div>
        `);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [drivers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapContainerRef} className="h-96 rounded-md" data-testid="map-container" />
      </CardContent>
    </Card>
  );
}
