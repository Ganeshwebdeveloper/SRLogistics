import { DriverDashboard } from "@/components/DriverDashboard";
import { CrateCounter } from "@/components/CrateCounter";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Truck } from "lucide-react";
import type { User } from "@shared/schema";

interface DriverPageProps {
  user: User;
  onLogout: () => void;
}

export default function DriverPage({ user, onLogout }: DriverPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">DeliTruck Driver</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DriverDashboard 
              driverName="John Smith"
              assignedTrip={{
                truckNumber: "TRK-001",
                route: "North District Route",
                status: "not-started",
              }}
            />
            <ChatInterface currentUserId="driver-1" currentUserName="John Smith" />
          </div>
          
          <div>
            <CrateCounter initialCount={100} />
          </div>
        </div>
      </main>
    </div>
  );
}
