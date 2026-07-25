import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminSearchBar } from "@/components/layout/AdminSearchBar";
import { AppSidebar } from "@/components/layout/AppSidebar";

export function AdminLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AdminSearchBar />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
