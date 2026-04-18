"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Leaf, Droplets, FlaskConical, BarChart2, LayoutDashboard, LogOut, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import SessionHistory from "@/components/chat/SessionHistory";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat/crop-doctor", label: "Crop Doctor", icon: Leaf },
  { href: "/chat/irrigation", label: "Irrigation", icon: Droplets },
  { href: "/chat/soil-health", label: "Soil Health", icon: FlaskConical },
  { href: "/tracker", label: "Finance Tracker", icon: BarChart2 },
];

const MODULE_ROUTES: Record<string, string> = {
  crop_doctor: "/chat/crop-doctor",
  irrigation: "/chat/irrigation",
  soil_health: "/chat/soil-health",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAppStore();

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  // Only show global history on dashboard/tracker, not on chat pages (they have their own)
  const isChatPage = pathname.startsWith("/chat/");

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-farm-green text-white flex flex-col shadow-lg z-50">
      <div className="p-6 border-b border-farm-light/30">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Leaf className="w-6 h-6 text-farm-pale" />
          FarmSense AI
        </h1>
        <p className="text-xs text-farm-pale/70 mt-1">Your AI farming assistant</p>
      </div>

      <nav className="p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-farm-light text-white" : "text-farm-pale hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Recent sessions — only on non-chat pages */}
      {!isChatPage && (
        <div className="flex-1 overflow-y-auto border-t border-farm-light/20 pt-1">
          <SessionHistory
            variant="dark"
            onSelect={(sessionId, module) => {
              router.push(`${MODULE_ROUTES[module]}?session=${sessionId}`);
            }}
          />
        </div>
      )}

      {isChatPage && <div className="flex-1" />}

      <div className="p-4 border-t border-farm-light/30 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-farm-light flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-farm-pale/60 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-farm-pale/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
