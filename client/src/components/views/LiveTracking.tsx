import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapView } from "@/components/MapView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Gauge, Clock } from "lucide-react";
import type { Trip, User, Truck, Route } from "@shared/schema";
import { formatDistanceToNow, parseISO } from "date-fns";

const TRUCK_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

interface GpsLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
}

const DEFAULT_LOCATION: [number, number] = [40.7128, -74.0060]; // New York City

export function LiveTracking() {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [gpsLocations, setGpsLocations] = useState<Map<string, GpsLocation>>(new Map());
  const [tripMetrics, setTripMetrics] = useState<Map<string, { distance: number; speed: number; duration: number }>>(new Map());

  // Calculate distance between two GPS coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: drivers = [] } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/drivers"],
  });

  const { data: trucks = [] } = useQuery<Truck[]>({
    queryKey: ["/api/trucks"],
  });

  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established for GPS tracking");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "location_update") {
          console.log("📍 Received GPS location update:", {
            tripId: message.tripId,
            latitude: message.latitude,
            longitude: message.longitude,
            timestamp: message.timestamp
          });
          
          setGpsLocations((prev) => {
            const updated = new Map(prev);
            const previousLocation = prev.get(message.tripId);
            const newLocation = {
              latitude: message.latitude,
              longitude: message.longitude,
              timestamp: message.timestamp,
            };
            updated.set(message.tripId, newLocation);
            
            console.log("🗺️ Updated GPS locations map:", Array.from(updated.entries()));

            // Calculate distance if we have a previous location
            if (previousLocation) {
              const distanceTraveled = calculateDistance(
                previousLocation.latitude,
                previousLocation.longitude,
                newLocation.latitude,
                newLocation.longitude
              );

              // Update metrics if movement is significant (more than 10 meters)
              if (distanceTraveled > 0.01) {
                setTripMetrics((prevMetrics) => {
                  const updatedMetrics = new Map(prevMetrics);
                  const currentMetrics = updatedMetrics.get(message.tripId) || { distance: 0, speed: 0, duration: 0 };
                  updatedMetrics.set(message.tripId, {
                    ...currentMetrics,
                    distance: currentMetrics.distance + distanceTraveled,
                  });
                  return updatedMetrics;
                });
              }
            }

            return updated;
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed for GPS tracking");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, []);

  // Update duration and speed every second for all ongoing trips
  useEffect(() => {
    const interval = setInterval(() => {
      trips.forEach((trip) => {
        if (trip.status === "ongoing" && trip.startTime) {
          const now = new Date();
          const start = typeof trip.startTime === 'string' ? new Date(trip.startTime) : trip.startTime;
          const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
          
          setTripMetrics((prevMetrics) => {
            const updatedMetrics = new Map(prevMetrics);
            const currentMetrics = updatedMetrics.get(trip.id) || { distance: 0, speed: 0, duration: 0 };
            
            // Calculate average speed (km/h) = distance (km) / time (hours)
            const elapsedHours = elapsedSeconds / 3600;
            const avgSpeed = elapsedHours > 0 ? currentMetrics.distance / elapsedHours : 0;
            
            updatedMetrics.set(trip.id, {
              ...currentMetrics,
              duration: elapsedSeconds,
              speed: avgSpeed,
            });
            return updatedMetrics;
          });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trips]);

  const ongoingTrips = trips.filter((trip) => trip.status === "ongoing");

  const getColorForTruck = (truckNumber: string) => {
    const index = trucks.findIndex((t) => t.truckNumber === truckNumber);
    return TRUCK_COLORS[index % TRUCK_COLORS.length];
  };

  const driversWithLocations = ongoingTrips.map((trip) => {
    const driver = drivers.find((d) => d.id === trip.driverId);
    const truck = trucks.find((t) => t.id === trip.truckId);
    const truckNumber = truck?.truckNumber || "Unknown";
    const gpsLocation = gpsLocations.get(trip.id);
    
    const position: [number, number] = gpsLocation 
      ? [gpsLocation.latitude, gpsLocation.longitude]
      : DEFAULT_LOCATION;
    
    console.log(`🚚 Driver location for trip ${trip.id}:`, {
      truckNumber,
      driverName: driver?.name,
      gpsLocation,
      position,
      hasGpsData: !!gpsLocation
    });
    
    return {
      id: trip.id,
      name: driver?.name || "Unknown Driver",
      position,
      truckNumber,
      color: getColorForTruck(truckNumber),
    };
  });

  const filteredLocations = selectedTripId
    ? driversWithLocations.filter((loc) => loc.id === selectedTripId)
    : driversWithLocations;

  const handleRowClick = (tripId: string) => {
    setSelectedTripId(selectedTripId === tripId ? null : tripId);
  };

  const getDuration = (startTime: Date | string | null) => {
    if (!startTime) return "N/A";
    try {
      const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
      return formatDistanceToNow(start, { addSuffix: false });
    } catch {
      return "N/A";
    }
  };

  const selectedTrip = ongoingTrips.find((trip) => trip.id === selectedTripId);
  const selectedMetrics = selectedTripId ? tripMetrics.get(selectedTripId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Live Tracking</h1>
        <p className="text-muted-foreground">
          Track your fleet in real-time on the map. Click on a trip to view its location and metrics.
        </p>
      </div>

      <MapView drivers={filteredLocations} />

      {selectedTrip && selectedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-card-purple hover-lift shadow-xl animate-scale-in overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-glow"></div>
                  <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/70 font-semibold uppercase tracking-wide">Distance</p>
                  <p className="text-3xl font-bold mt-1 text-white">{selectedMetrics.distance.toFixed(1)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-green hover-lift shadow-xl animate-scale-in overflow-hidden" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-glow"></div>
                  <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                    <Gauge className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/70 font-semibold uppercase tracking-wide">Avg Speed</p>
                  <p className="text-3xl font-bold mt-1 text-white">{selectedMetrics.speed.toFixed(0)} km/h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-orange hover-lift shadow-xl animate-scale-in overflow-hidden" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-glow"></div>
                  <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/70 font-semibold uppercase tracking-wide">Duration</p>
                  <p className="text-3xl font-bold mt-1 text-white">
                    {Math.floor(selectedMetrics.duration / 60)}:{(selectedMetrics.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="hover-lift animate-fade-in">
        <CardHeader>
          <CardTitle>Active Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {ongoingTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active trips at the moment
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle No.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ongoingTrips.map((trip) => {
                  const driver = drivers.find((d) => d.id === trip.driverId);
                  const truck = trucks.find((t) => t.id === trip.truckId);
                  const route = routes.find((r) => r.id === trip.routeId);
                  const truckNumber = truck?.truckNumber || "Unknown";
                  const color = getColorForTruck(truckNumber);
                  const isSelected = selectedTripId === trip.id;
                  const metrics = tripMetrics.get(trip.id);

                  return (
                    <TableRow
                      key={trip.id}
                      data-testid={`row-active-trip-${trip.id}`}
                      onClick={() => handleRowClick(trip.id)}
                      className={`cursor-pointer ${isSelected ? "bg-muted" : ""}`}
                    >
                      <TableCell className="font-medium">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: color,
                            color: color,
                            backgroundColor: `${color}10`,
                          }}
                          data-testid={`badge-vehicle-${truckNumber}`}
                        >
                          {truckNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>{driver?.name || "Unknown"}</TableCell>
                      <TableCell>{route?.routeName || "Unknown Route"}</TableCell>
                      <TableCell>{metrics ? metrics.speed.toFixed(0) : "0"} km/h</TableCell>
                      <TableCell>{metrics ? metrics.distance.toFixed(1) : "0"} km</TableCell>
                      <TableCell>{metrics ? `${Math.floor(metrics.duration / 60)}:${(metrics.duration % 60).toString().padStart(2, '0')}` : getDuration(trip.startTime)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
