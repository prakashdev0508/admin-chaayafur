import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminSearchOverlay } from "@/components/layout/AdminSearchOverlay";
import { AppSidebar } from "@/components/layout/AppSidebar";

export function AdminLayout() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar onOpenSearch={() => setSearchOpen(true)} />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
        <AdminSearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
      </SidebarProvider>
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
