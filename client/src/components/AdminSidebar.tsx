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
import { Truck, LayoutDashboard, MapPin, Package, MessageSquare, Settings } from "lucide-react";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/admin" },
  { title: "Fleet Management", icon: Truck, url: "/admin/fleet" },
  { title: "Live Tracking", icon: MapPin, url: "/admin/tracking" },
  { title: "Crates", icon: Package, url: "/admin/crates" },
  { title: "Group Chat", icon: MessageSquare, url: "/admin/chat" },
  { title: "Settings", icon: Settings, url: "/admin/settings" },
];

interface AdminSidebarProps {
  activeItem?: string;
  onItemClick?: (url: string) => void;
}

export function AdminSidebar({ activeItem = "/admin", onItemClick }: AdminSidebarProps) {
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
                    asChild
                    isActive={activeItem === item.url}
                    onClick={() => onItemClick?.(item.url)}
                  >
                    <a href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
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
