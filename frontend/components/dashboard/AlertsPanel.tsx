"use client";
import { useEffect, useState, useCallback } from "react";
import { getAlerts } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { AlertTriangle, Info, Zap, X, Bell, Loader2, RefreshCw } from "lucide-react";

interface Alert {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "urgent";
  module: string;
}

const TYPE_CONFIG = {
  urgent: { icon: Zap, bg: "bg-red-50 border-red-200", text: "text-red-700", badge: "bg-red-500", iconColor: "text-red-500" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 border-amber-200", text: "text-amber-700", badge: "bg-amber-500", iconColor: "text-amber-500" },
  info: { icon: Info, bg: "bg-blue-50 border-blue-200", text: "text-blue-700", badge: "bg-blue-400", iconColor: "text-blue-500" },
};

const MODULE_LABELS: Record<string, string> = {
  crop_doctor: "Crop Doctor",
  irrigation: "Irrigation",
  soil_health: "Soil Health",
};

const THIRTY_MIN = 30 * 60 * 1000;

export default function AlertsPanel() {
  const { location, dismissedAlerts, dismissAlert } = useAppStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const fetchAlerts = useCallback(async (force = false) => {
    if (!location) return;
    const now = Date.now();
    if (!force && lastFetched && now - lastFetched < THIRTY_MIN) return;
    setLoading(true);
    try {
      const data = await getAlerts(location.lat, location.lon);
      setAlerts(Array.isArray(data) ? data : []);
      setLastFetched(now);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [location, lastFetched]);

  // Fetch on mount and every 30 min
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(true), THIRTY_MIN);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const visible = alerts.filter((a) => !dismissedAlerts.includes(a.id));
  const urgentCount = visible.filter((a) => a.type === "urgent").length;
  const badgeCount = visible.length;

  if (!location) return null;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-farm-light hover:bg-farm-pale/30 transition-all duration-200 shadow-sm cursor-pointer"
      >
        <Bell className={`w-4 h-4 ${urgentCount > 0 ? "text-red-500 animate-bounce" : "text-gray-500"}`} />
        <span className="text-sm font-medium text-gray-700">Alerts</span>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
        {badgeCount > 0 && (
          <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1 ${urgentCount > 0 ? "bg-red-500" : "bg-farm-green"}`}>
            {badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-11 right-0 z-50 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-sm text-gray-700">Farm Alerts</span>
              {badgeCount > 0 && (
                <span className="bg-farm-green text-white text-xs px-1.5 py-0.5 rounded-full">{badgeCount}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAlerts(true)}
                className="text-gray-400 hover:text-farm-green transition-colors cursor-pointer"
                title="Refresh alerts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && visible.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating alerts…
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <span className="text-3xl mb-2">✅</span>
                <p className="text-sm">No alerts right now</p>
                <p className="text-xs mt-1">Your farm looks good!</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {visible.map((alert, i) => {
                  const cfg = TYPE_CONFIG[alert.type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={alert.id}
                      className={`relative border rounded-xl p-3 ${cfg.bg} animate-slide-up`}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-start gap-2.5 pr-5">
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                        <div>
                          <p className={`text-xs font-semibold ${cfg.text}`}>{alert.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{alert.message}</p>
                          <span className="inline-block mt-1.5 text-[10px] bg-white/60 text-gray-500 px-2 py-0.5 rounded-full">
                            {MODULE_LABELS[alert.module] ?? alert.module}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
