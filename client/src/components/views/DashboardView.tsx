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

const DEFAULT_LOCATION: [number, number] = [40.7128, -74.0060];

const TRUCK_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

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

  const getColorForTruck = (truckNumber: string) => {
    const index = trucks.findIndex((t) => t.truckNumber === truckNumber);
    return TRUCK_COLORS[index % TRUCK_COLORS.length];
  };

  const driversWithLocations = ongoingTrips.map((trip) => {
    const driver = drivers.find((d) => d.id === trip.driverId);
    const truck = trucks.find((t) => t.id === trip.truckId);
    const truckNumber = truck?.truckNumber || "Unknown";
    
    let position: [number, number] = DEFAULT_LOCATION;
    
    if (trip.currentLocation) {
      try {
        const location = JSON.parse(trip.currentLocation);
        if (location.latitude && location.longitude) {
          position = [location.latitude, location.longitude];
        }
      } catch (error) {
        console.error(`Failed to parse currentLocation for trip ${trip.id}:`, error);
      }
    }
    
    return {
      id: trip.id,
      name: driver?.name || "Unknown Driver",
      position,
      truckNumber,
      color: getColorForTruck(truckNumber),
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
        <StatsCard 
          title="Active Trips" 
          value={ongoingTrips.length} 
          icon={Truck} 
          gradientClass="gradient-card-blue"
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Available Drivers"
          value={availableDrivers.length}
          icon={Users}
          gradientClass="gradient-card-green"
          iconColor="text-green-500"
        />
        <StatsCard 
          title="Total Distance" 
          value={`${totalDistance} km`} 
          icon={MapPin}
          gradientClass="gradient-card-purple"
          iconColor="text-purple-500"
        />
        <StatsCard 
          title="Total Trips" 
          value={trips.length} 
          icon={Package}
          gradientClass="gradient-card-orange"
          iconColor="text-orange-500"
        />
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
