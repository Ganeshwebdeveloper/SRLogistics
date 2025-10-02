import { useState } from "react";
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

export function LiveTracking() {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

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

  const ongoingTrips = trips.filter((trip) => trip.status === "ongoing");

  const getColorForTruck = (truckNumber: string) => {
    const index = trucks.findIndex((t) => t.truckNumber === truckNumber);
    return TRUCK_COLORS[index % TRUCK_COLORS.length];
  };

  const driversWithLocations = ongoingTrips.map((trip) => {
    const driver = drivers.find((d) => d.id === trip.driverId);
    const truck = trucks.find((t) => t.id === trip.truckId);
    const truckNumber = truck?.truckNumber || "Unknown";
    return {
      id: trip.id,
      name: driver?.name || "Unknown Driver",
      position: [40.7128 + Math.random() * 0.1, -74.006 + Math.random() * 0.1] as [
        number,
        number
      ],
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Live Tracking</h1>
        <p className="text-muted-foreground">
          Track your fleet in real-time on the map. Click on a trip to view its location.
        </p>
      </div>

      <MapView drivers={filteredLocations} />

      <Card>
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
                      <TableCell>{trip.avgSpeed || "0"} km/h</TableCell>
                      <TableCell>{trip.distanceTravelled || "0"} km</TableCell>
                      <TableCell>{getDuration(trip.startTime)}</TableCell>
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
