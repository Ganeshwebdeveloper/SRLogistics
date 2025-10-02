import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Trip, Crate, User, Route } from "@shared/schema";
import { format, parseISO } from "date-fns";

export function CratesView() {
  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: drivers = [] } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/drivers"],
  });

  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  const ongoingTrips = trips.filter((trip) => trip.status === "ongoing" || trip.status === "scheduled");

  const getDriver = (driverId: string) =>
    drivers.find((d) => d.id === driverId)?.name || "Unknown";

  const getRoute = (routeId: string) =>
    routes.find((r) => r.id === routeId)?.routeName || "Unknown";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Crates Management</h1>
        <p className="text-muted-foreground">
          Monitor crate counts for active and scheduled trips
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Trip Crates</CardTitle>
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
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ongoingTrips.map((trip) => (
                  <TableRow key={trip.id} data-testid={`row-trip-${trip.id}`}>
                    <TableCell className="font-medium">
                      {getDriver(trip.driverId)}
                    </TableCell>
                    <TableCell>{getRoute(trip.routeId)}</TableCell>
                    <TableCell>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </TableCell>
                    <TableCell>
                      {trip.startTime
                        ? format(parseISO(typeof trip.startTime === 'string' ? trip.startTime : trip.startTime.toISOString()), "MMM dd, yyyy HH:mm")
                        : "Not started"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
