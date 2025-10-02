import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { StatsCard } from "@/components/StatsCard";
import { TripAssignmentForm } from "@/components/TripAssignmentForm";
import { MapView } from "@/components/MapView";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Truck, Users, MapPin, Package } from "lucide-react";

export default function AdminDashboardPage() {
  const drivers = [
    {
      id: "1",
      name: "John Smith",
      position: [40.7128, -74.0060] as [number, number],
      truckNumber: "TRK-001",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      position: [40.7580, -73.9855] as [number, number],
      truckNumber: "TRK-002",
    },
  ];

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          
          <main className="flex-1 overflow-auto p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Monitor and manage your fleet operations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Active Trips" value="3" icon={Truck} />
              <StatsCard title="Available Drivers" value="5" icon={Users} />
              <StatsCard title="Total Distance" value="247 km" icon={MapPin} />
              <StatsCard title="Crates Delivered" value="1,234" icon={Package} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <MapView drivers={drivers} />
                <ChatInterface currentUserId="admin-1" currentUserName="Admin" />
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
