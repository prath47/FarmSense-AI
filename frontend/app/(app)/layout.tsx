"use client";
import Sidebar from "@/components/dashboard/Sidebar";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import AuthGuard from "@/components/AuthGuard";
import { useAutoLocation } from "@/lib/useLocation";

function AppShell({ children }: { children: React.ReactNode }) {
  useAutoLocation();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <header className="flex items-center justify-end px-6 pt-4 pb-0">
          <AlertsPanel />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
