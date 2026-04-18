"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";
import SessionHistory from "@/components/chat/SessionHistory";
import { FlaskConical } from "lucide-react";

export default function SoilHealthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const s = searchParams.get("session");
    if (s) { setActiveSessionId(s); router.replace("/chat/soil-health"); }
  }, [searchParams, router]);

  return (
    <div className="flex gap-5 max-w-6xl mx-auto page-enter">
      <aside className="w-56 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chat History</h3>
          </div>
          <div className="p-2 max-h-[calc(100vh-160px)] overflow-y-auto">
            <SessionHistory currentModule="soil_health" onSelect={setActiveSessionId} refreshKey={refreshKey} />
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-5 animate-slide-up">
          <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Soil Health Advisor</h2>
            <p className="text-sm text-gray-500">Upload a soil photo or describe your soil for regenerative advice</p>
          </div>
        </div>
        <ChatWindow
          module="soil_health"
          allowImages
          placeholder="Describe your soil type, region, or upload a soil photo…"
          activeSessionId={activeSessionId}
          onSessionChange={() => { setActiveSessionId(null); setRefreshKey((k) => k + 1); }}
        />
      </div>
    </div>
  );
}
