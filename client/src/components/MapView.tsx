import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Satellite } from "lucide-react";
import * as L from "leaflet";

interface MapViewProps {
  drivers?: Array<{
    id: string;
    name: string;
    position: [number, number];
    truckNumber: string;
    color?: string;
  }>;
}

export function MapView({ drivers = [] }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const [mapView, setMapView] = useState<"street" | "satellite">("street");

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([40.7128, -74.0060], 12);
      
      streetLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      });
      
      satelliteLayerRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      });

      streetLayerRef.current.addTo(map);

      mapRef.current = map;
    }

    const currentDriverIds = new Set(drivers.map(d => d.id));
    const existingDriverIds = new Set(markersMapRef.current.keys());

    existingDriverIds.forEach(id => {
      if (!currentDriverIds.has(id)) {
        const marker = markersMapRef.current.get(id);
        if (marker) {
          marker.remove();
          markersMapRef.current.delete(id);
        }
      }
    });

    drivers.forEach((driver) => {
      console.log(`📌 Processing marker for ${driver.name}:`, {
        id: driver.id,
        position: driver.position,
        truckNumber: driver.truckNumber
      });
      
      const existingMarker = markersMapRef.current.get(driver.id);
      
      if (existingMarker) {
        console.log(`  ↪️ Updating existing marker position to:`, driver.position);
        existingMarker.setLatLng(driver.position);
      } else {
        console.log(`  ✨ Creating new marker at:`, driver.position);
        const color = driver.color || "#3b82f6";
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex flex-col items-center transition-all">
              <div class="w-12 h-12 flex items-center justify-center font-bold text-white shadow-lg rounded-lg" 
                   style="background-color: ${color}; border: 3px solid white;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                  <path d="M15 18H9"></path>
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
                  <circle cx="17" cy="18" r="2"></circle>
                  <circle cx="7" cy="18" r="2"></circle>
                </svg>
              </div>
              <div class="mt-1 px-2 py-1 rounded text-xs font-semibold text-white shadow-md" 
                   style="background-color: ${color};">
                ${driver.truckNumber}
              </div>
              <div class="mt-1 bg-white/95 px-2 py-1 rounded text-xs font-medium border shadow-sm">
                ${driver.name}
              </div>
            </div>
          `,
          iconSize: [60, 80],
          iconAnchor: [30, 40],
        });

        const marker = L.marker(driver.position, { icon: customIcon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="p-2">
              <div class="font-bold" style="color: ${color};">${driver.truckNumber}</div>
              <div class="text-sm"><strong>${driver.name}</strong></div>
            </div>
          `);
        
        markersMapRef.current.set(driver.id, marker);
      }
    });

    if (drivers.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(drivers.map(d => d.position));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [drivers]);

  useEffect(() => {
    if (!mapRef.current || !streetLayerRef.current || !satelliteLayerRef.current) return;

    if (mapView === "street") {
      if (mapRef.current.hasLayer(satelliteLayerRef.current)) {
        mapRef.current.removeLayer(satelliteLayerRef.current);
      }
      if (!mapRef.current.hasLayer(streetLayerRef.current)) {
        streetLayerRef.current.addTo(mapRef.current);
      }
    } else {
      if (mapRef.current.hasLayer(streetLayerRef.current)) {
        mapRef.current.removeLayer(streetLayerRef.current);
      }
      if (!mapRef.current.hasLayer(satelliteLayerRef.current)) {
        satelliteLayerRef.current.addTo(mapRef.current);
      }
    }
  }, [mapView]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const toggleMapView = () => {
    setMapView(prev => prev === "street" ? "satellite" : "street");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Live Tracking</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMapView}
          data-testid="button-toggle-map-view"
          className="gap-2"
        >
          {mapView === "street" ? (
            <>
              <Satellite className="h-4 w-4" />
              Satellite
            </>
          ) : (
            <>
              <MapIcon className="h-4 w-4" />
              Street
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={mapContainerRef} className="h-96 rounded-md" data-testid="map-container" />
      </CardContent>
    </Card>
  );
}
