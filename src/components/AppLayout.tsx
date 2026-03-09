import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b gradient-header px-4 shrink-0">
            <SidebarTrigger className="mr-4 text-white/70 hover:text-white" />
          </header>
          <main className="flex-1 overflow-auto p-6 dot-pattern">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
