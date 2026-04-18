"use client";
import { useEffect, useState } from "react";
import { listSessions, deleteSession } from "@/lib/api";
import { Clock, Trash2, ChevronDown, ChevronRight, Loader2, MessageSquare } from "lucide-react";

interface SessionSummary {
  id: string;
  module: string;
  createdAt: string;
  updatedAt: string;
  messages: { role: string; content: string }[];
}

const MODULE_LABELS: Record<string, string> = {
  crop_doctor: "Crop Doctor",
  irrigation: "Irrigation",
  soil_health: "Soil Health",
};

interface Props {
  currentModule?: string;
  onSelect: (sessionId: string, module: string) => void;
  refreshKey?: number;
  /** dark = sidebar (green bg), light = white card panel */
  variant?: "dark" | "light";
}

export default function SessionHistory({ currentModule, onSelect, refreshKey, variant = "light" }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteSession(id);
    setSessions((s) => s.filter((sess) => sess.id !== id));
    setDeletingId(null);
  };

  const filtered = currentModule
    ? sessions.filter((s) => s.module === currentModule)
    : sessions;

  if (filtered.length === 0 && !loading) return null;

  const isDark = variant === "dark";

  return (
    <div className="mt-1">
      {/* Section header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
          isDark
            ? "text-farm-pale/60 hover:text-farm-pale"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        {open
          ? <ChevronDown className="w-3 h-3 shrink-0" />
          : <ChevronRight className="w-3 h-3 shrink-0" />}
        <Clock className="w-3 h-3 shrink-0" />
        {currentModule ? "Past Sessions" : "Recent Chats"}
        {!loading && filtered.length > 0 && (
          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium ${
            isDark ? "bg-white/10 text-farm-pale/70" : "bg-farm-pale text-farm-green"
          }`}>
            {filtered.length}
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-0.5">
          {loading ? (
            <div className={`flex items-center gap-2 px-3 py-2 text-xs ${isDark ? "text-farm-pale/40" : "text-gray-400"}`}>
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </div>
          ) : (
            filtered.map((session, i) => {
              const preview = session.messages[0]?.content ?? "Empty session";
              const label = currentModule ? null : MODULE_LABELS[session.module];
              const date = new Date(session.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

              return (
                <div
                  key={session.id}
                  onClick={() => onSelect(session.id, session.module)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group animate-fade-in ${
                    isDark
                      ? "hover:bg-white/10"
                      : "hover:bg-farm-pale/60 border border-transparent hover:border-farm-light/20"
                  }`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? "text-farm-pale/50" : "text-farm-green/40"}`} />
                  <div className="flex-1 min-w-0">
                    {label && (
                      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${
                        isDark ? "text-farm-light/70" : "text-farm-green"
                      }`}>
                        {label}
                      </p>
                    )}
                    <p className={`text-xs truncate leading-snug font-medium ${isDark ? "text-farm-pale/90" : "text-gray-700"}`}>
                      {preview}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isDark ? "text-farm-pale/40" : "text-gray-400"}`}>{date}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className={`opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5 cursor-pointer ${
                      isDark ? "text-farm-pale/30 hover:text-red-400" : "text-gray-300 hover:text-red-500"
                    }`}
                  >
                    {deletingId === session.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
