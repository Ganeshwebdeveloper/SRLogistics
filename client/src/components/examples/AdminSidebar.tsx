import { AdminSidebar } from '../AdminSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function AdminSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
      </div>
    </SidebarProvider>
  )
}
