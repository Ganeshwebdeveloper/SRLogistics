import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { User } from "@shared/schema";

// Import view components
import { DashboardView } from "@/components/views/DashboardView";
import { FleetManagement } from "@/components/views/FleetManagement";
import { LiveTracking } from "@/components/views/LiveTracking";
import { CratesView } from "@/components/views/CratesView";
import { GroupChatView } from "@/components/views/GroupChatView";
import { TripsManagement } from "@/components/views/TripsManagement";

interface AdminDashboardPageProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboardPage({ user, onLogout }: AdminDashboardPageProps) {
  const [activeView, setActiveView] = useState<string>("dashboard");

  const style = {
    "--sidebar-width": "16rem",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView userId={user.id} userName={user.name} />;
      case "fleet":
        return <FleetManagement />;
      case "tracking":
        return <LiveTracking />;
      case "crates":
        return <CratesView />;
      case "chat":
        return <GroupChatView userId={user.id} userName={user.name} />;
      case "trips":
        return <TripsManagement />;
      default:
        return <DashboardView userId={user.id} userName={user.name} />;
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar activeItem={activeView} onItemClick={setActiveView} />
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
          
          <main className="flex-1 overflow-auto p-6">
            {renderView()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
