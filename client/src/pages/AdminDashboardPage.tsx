import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { StatsCard } from "@/components/StatsCard";
import { TripAssignmentForm } from "@/components/TripAssignmentForm";
import { MapView } from "@/components/MapView";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Truck, Users, MapPin, Package, LogOut } from "lucide-react";
import type { User, Trip, Truck as TruckType } from "@shared/schema";

interface AdminDashboardPageProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboardPage({ user, onLogout }: AdminDashboardPageProps) {
  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: trucks = [] } = useQuery<TruckType[]>({
    queryKey: ["/api/trucks"],
  });

  const { data: drivers = [] } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/drivers"],
  });

  const ongoingTrips = trips.filter(trip => trip.status === "ongoing");
  const availableDrivers = drivers.filter(driver => 
    !ongoingTrips.some(trip => trip.driverId === driver.id)
  );

  const totalDistance = trips
    .reduce((sum, trip) => sum + parseFloat(trip.distanceTravelled || "0"), 0)
    .toFixed(1);

  const style = {
    "--sidebar-width": "16rem",
  };

  const driversWithLocations = ongoingTrips.map(trip => {
    const driver = drivers.find(d => d.id === trip.driverId);
    const truck = trucks.find(t => t.id === trip.truckId);
    return {
      id: trip.id,
      name: driver?.name || "Unknown Driver",
      position: [40.7128 + Math.random() * 0.1, -74.0060 + Math.random() * 0.1] as [number, number],
      truckNumber: truck?.truckNumber || "Unknown",
    };
  });

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b gap-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {user.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                data-testid="button-logout"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Monitor and manage your fleet operations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="Active Trips" 
                value={ongoingTrips.length} 
                icon={Truck} 
              />
              <StatsCard 
                title="Available Drivers" 
                value={availableDrivers.length} 
                icon={Users} 
              />
              <StatsCard 
                title="Total Distance" 
                value={`${totalDistance} km`} 
                icon={MapPin} 
              />
              <StatsCard 
                title="Total Trips" 
                value={trips.length} 
                icon={Package} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <MapView drivers={driversWithLocations} />
                <ChatInterface currentUserId={user.id} currentUserName={user.name} />
              </div>
              
              <div>
                <TripAssignmentForm />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
