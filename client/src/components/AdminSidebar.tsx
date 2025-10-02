import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Truck, LayoutDashboard, MapPin, Package, MessageSquare, List } from "lucide-react";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Trips", icon: List, id: "trips" },
  { title: "Fleet Management", icon: Truck, id: "fleet" },
  { title: "Live Tracking", icon: MapPin, id: "tracking" },
  { title: "Crates", icon: Package, id: "crates" },
  { title: "Group Chat", icon: MessageSquare, id: "chat" },
];

interface AdminSidebarProps {
  activeItem?: string;
  onItemClick?: (id: string) => void;
}

export function AdminSidebar({ activeItem = "dashboard", onItemClick }: AdminSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">SR Logistics</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={activeItem === item.id}
                    onClick={() => onItemClick?.(item.id)}
                    data-testid={`link-${item.title.toLowerCase().replace(/ /g, '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
