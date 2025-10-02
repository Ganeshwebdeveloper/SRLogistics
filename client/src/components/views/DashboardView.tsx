import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/StatsCard";
import { TripAssignmentForm } from "@/components/TripAssignmentForm";
import { MapView } from "@/components/MapView";
import { ChatInterface } from "@/components/ChatInterface";
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
import { Truck, Users, MapPin, Package } from "lucide-react";
import type { User, Trip, Truck as TruckType } from "@shared/schema";

interface DashboardViewProps {
  userId: string;
  userName: string;
}

export function DashboardView({ userId, userName }: DashboardViewProps) {
  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: trucks = [] } = useQuery<TruckType[]>({
    queryKey: ["/api/trucks"],
  });

  const { data: drivers = [] } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/drivers"],
  });

  const ongoingTrips = trips.filter((trip) => trip.status === "ongoing");
  const availableDrivers = drivers.filter(
    (driver) => !ongoingTrips.some((trip) => trip.driverId === driver.id)
  );

  const availableTrucks = trucks.filter((t) => t.status === "available");

  const totalDistance = trips
    .reduce((sum, trip) => sum + parseFloat(trip.distanceTravelled || "0"), 0)
    .toFixed(1);

  const driversWithLocations = ongoingTrips.map((trip) => {
    const driver = drivers.find((d) => d.id === trip.driverId);
    const truck = trucks.find((t) => t.id === trip.truckId);
    return {
      id: trip.id,
      name: driver?.name || "Unknown Driver",
      position: [40.7128 + Math.random() * 0.1, -74.006 + Math.random() * 0.1] as [
        number,
        number
      ],
      truckNumber: truck?.truckNumber || "Unknown",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage your fleet operations</p>
      </div>

      <TripAssignmentForm />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Trips" value={ongoingTrips.length} icon={Truck} />
        <StatsCard
          title="Available Drivers"
          value={availableDrivers.length}
          icon={Users}
        />
        <StatsCard title="Total Distance" value={`${totalDistance} km`} icon={MapPin} />
        <StatsCard title="Total Trips" value={trips.length} icon={Package} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover-lift animate-fade-in">
          <CardHeader>
            <CardTitle>Available Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            {availableDrivers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No available drivers at the moment
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableDrivers.map((driver) => (
                    <TableRow key={driver.id} data-testid={`row-driver-${driver.id}`}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid="badge-status-available">
                          Available
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in">
          <CardHeader>
            <CardTitle>Available Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            {availableTrucks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No available vehicles at the moment
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck Number</TableHead>
                    <TableHead>Capacity (L)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableTrucks.map((truck) => (
                    <TableRow key={truck.id} data-testid={`row-truck-${truck.id}`}>
                      <TableCell className="font-medium">{truck.truckNumber}</TableCell>
                      <TableCell>{truck.capacity}</TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid="badge-status-available">
                          Available
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <MapView drivers={driversWithLocations} />
        <ChatInterface currentUserId={userId} currentUserName={userName} />
      </div>
    </div>
  );
}
