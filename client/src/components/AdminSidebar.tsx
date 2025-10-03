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
import { Truck, LayoutDashboard, MapPin, Package, MessageSquare, List, IndianRupee } from "lucide-react";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Trips", icon: List, id: "trips" },
  { title: "Driver Salary", icon: IndianRupee, id: "salary" },
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
      <SidebarHeader className="p-5 border-b border-sidebar-border bg-gradient-to-br from-sidebar/50 to-sidebar">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="p-2 bg-primary rounded-lg shadow-md">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">SR Logistics</h2>
            <p className="text-xs text-muted-foreground font-medium">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wide px-3 py-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.title} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                  <SidebarMenuButton
                    isActive={activeItem === item.id}
                    onClick={() => onItemClick?.(item.id)}
                    data-testid={`link-${item.title.toLowerCase().replace(/ /g, '-')}`}
                    className="transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
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
