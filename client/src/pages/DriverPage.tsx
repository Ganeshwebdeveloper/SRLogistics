import { DriverDashboard } from "@/components/DriverDashboard";
import { CrateCounter } from "@/components/CrateCounter";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Truck as TruckIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { User, Trip, Truck, Route } from "@shared/schema";

interface DriverPageProps {
  user: User;
  onLogout: () => void;
}

export default function DriverPage({ user, onLogout }: DriverPageProps) {
  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips/driver", user.id],
  });

  const currentTrip = trips?.find(
    (trip) => trip.status === "ongoing" || trip.status === "scheduled"
  );

  const { data: truck } = useQuery<Truck>({
    queryKey: ["/api/trucks", currentTrip?.truckId],
    enabled: !!currentTrip?.truckId,
  });

  const { data: route } = useQuery<Route>({
    queryKey: ["/api/routes", currentTrip?.routeId],
    enabled: !!currentTrip?.routeId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-header border-b shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between animate-slide-in-right">
          <div className="flex items-center gap-3">
            <TruckIcon className="h-7 w-7 text-white" />
            <h1 className="text-xl font-bold text-white">SR Logistics Driver</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DriverDashboard 
              driverName={user.name}
              assignedTrip={
                currentTrip
                  ? {
                      truckNumber: truck?.truckNumber || "Unknown",
                      route: route?.routeName || "Unknown Route",
                      status: currentTrip.status === "scheduled" ? "not-started" : "ongoing",
                    }
                  : undefined
              }
              tripId={currentTrip?.id}
              driverId={user.id}
              onLogout={onLogout}
            />
            <ChatInterface currentUserId={user.id} currentUserName={user.name} />
          </div>
          
          <div>
            <CrateCounter 
              initialCount={currentTrip ? 100 : 0}
              tripId={currentTrip?.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
