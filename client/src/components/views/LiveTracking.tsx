import { useQuery } from "@tanstack/react-query";
import { MapView } from "@/components/MapView";
import type { Trip, User, Truck } from "@shared/schema";

export function LiveTracking() {
  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: drivers = [] } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/drivers"],
  });

  const { data: trucks = [] } = useQuery<Truck[]>({
    queryKey: ["/api/trucks"],
  });

  const ongoingTrips = trips.filter((trip) => trip.status === "ongoing");

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
        <h1 className="text-3xl font-bold mb-2">Live Tracking</h1>
        <p className="text-muted-foreground">
          Track your fleet in real-time on the map
        </p>
      </div>

      <MapView drivers={driversWithLocations} />
    </div>
  );
}
