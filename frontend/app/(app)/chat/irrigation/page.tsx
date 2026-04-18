"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";
import SessionHistory from "@/components/chat/SessionHistory";
import { Droplets } from "lucide-react";

export default function IrrigationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const s = searchParams.get("session");
    if (s) { setActiveSessionId(s); router.replace("/chat/irrigation"); }
  }, [searchParams, router]);

  return (
    <div className="flex gap-5 max-w-6xl mx-auto page-enter">
      <aside className="w-56 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chat History</h3>
          </div>
          <div className="p-2 max-h-[calc(100vh-160px)] overflow-y-auto">
            <SessionHistory currentModule="irrigation" onSelect={setActiveSessionId} refreshKey={refreshKey} />
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-5 animate-slide-up">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Irrigation Advisor</h2>
            <p className="text-sm text-gray-500">Get precision watering schedules with real-time weather data</p>
          </div>
        </div>
        <ChatWindow
          module="irrigation"
          placeholder="Tell me your crop type, location, and soil type for irrigation advice…"
          activeSessionId={activeSessionId}
          onSessionChange={() => { setActiveSessionId(null); setRefreshKey((k) => k + 1); }}
        />
      </div>
    </div>
  );
}
