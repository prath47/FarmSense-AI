"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { streamChatMessage, deleteSession, getSession, extractTrackerItems as apiExtractTrackerItems } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import MessageBubble from "./MessageBubble";
import ImageUpload from "./ImageUpload";
import { Send, RefreshCw, Loader2, MapPin } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
  trackerItems?: TrackerItem[];
}

export interface TrackerItem {
  description: string;
  category: string;
  estimatedAmount: number;
}

interface Props {
  module: string;
  allowImages?: boolean;
  placeholder?: string;
  activeSessionId?: string | null;
  onSessionChange?: () => void;
}

export default function ChatWindow({ module, allowImages = false, placeholder, activeSessionId, onSessionChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { sessions, setSession, clearSession, location } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, [input]);

  useEffect(() => {
    if (!activeSessionId) return;
    setLoadingHistory(true);
    setMessages([]);
    getSession(activeSessionId)
      .then((data) => {
        if (!data) return;
        setSession(module, { sessionId: data.id, module });
        const loaded: Message[] = (data.messages as { role: string; content: string; imageBase64?: string }[]).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          imageDataUrl: m.imageBase64
            ? (m.imageBase64.startsWith("data:") ? m.imageBase64 : `data:image/jpeg;base64,${m.imageBase64}`)
            : undefined,
        }));
        setMessages(loaded);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  const sessionId = sessions[module]?.sessionId;

  const extractTrackerItems = async (aiReply: string): Promise<TrackerItem[]> => {
    try {
      return await apiExtractTrackerItems(aiReply);
    } catch {
      return [];
    }
  };

  const send = async () => {
    if (!input.trim() && !imageBase64) return;

    const userMsg: Message = { role: "user", content: input, imageDataUrl: imageDataUrl ?? undefined };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const sentBase64 = imageBase64;
    setImageBase64(null);
    setImageDataUrl(null);

    try {
      // Add an empty assistant bubble that fills in as tokens arrive
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      const res = await streamChatMessage(
        {
          module,
          sessionId,
          message: userMsg.content,
          imageBase64: sentBase64 ?? undefined,
          lat: location?.lat,
          lon: location?.lon,
        },
        (token) => {
          setMessages((m) => {
            const last = m[m.length - 1];
            if (last?.role !== "assistant") return m;
            return [...m.slice(0, -1), { ...last, content: last.content + token }];
          });
        },
      );

      if (!sessionId) {
        setSession(module, { sessionId: res.sessionId, module });
        onSessionChange?.();
      }

      setLoading(false);

      extractTrackerItems(res.reply).then((items) => {
        if (items.length === 0) return;
        setMessages((m) =>
          m.map((msg, i) =>
            i === m.length - 1 ? { ...msg, trackerItems: items } : msg
          )
        );
      });
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
      setLoading(false);
    }
  };

  const newSession = async () => {
    if (sessionId) await deleteSession(sessionId);
    clearSession(module);
    setMessages([]);
    setImageBase64(null);
    setImageDataUrl(null);
    onSessionChange?.();
  };

  const locationLabel = location ? `${location.city}${location.region ? `, ${location.region}` : ""}` : null;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">
            {sessionId ? `Session: ${sessionId.slice(0, 8)}…` : "New session"}
          </span>
          {locationLabel && (
            <span className="flex items-center gap-1 text-xs bg-farm-pale text-farm-green font-medium px-2.5 py-1 rounded-full animate-fade-in">
              <MapPin className="w-3 h-3" />
              {locationLabel}
            </span>
          )}
        </div>
        <button
          onClick={newSession}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-farm-green px-3 py-1.5 rounded-lg hover:bg-farm-pale transition-all duration-200 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" /> New Session
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 scroll-smooth">
        {loadingHistory ? (
          <div className="h-full flex items-center justify-center gap-3 text-gray-400 animate-fade-in">
            <Loader2 className="w-5 h-5 animate-spin text-farm-light" />
            <span className="text-sm">Loading conversation…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-farm-pale flex items-center justify-center">
              <span className="text-2xl">🌱</span>
            </div>
            <p className="text-sm">Ask me anything about your farm!</p>
            {locationLabel && (
              <p className="text-xs text-farm-green flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Providing region-specific advice for {locationLabel}
              </p>
            )}
          </div>
        ) : (
          messages.map((m, i) => {
            // Skip the empty placeholder bubble — the dots loader below handles that visual
            if (m.role === "assistant" && m.content === "" && i === messages.length - 1) return null;
            return (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                imageDataUrl={m.imageDataUrl}
                trackerItems={m.trackerItems}
              />
            );
          })
        )}

        {/* Show thinking dots until first token arrives */}
        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start mb-3 animate-slide-in-left">
            <div className="w-8 h-8 rounded-full bg-farm-green text-white flex items-center justify-center text-xs font-bold mr-2 shrink-0">AI</div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-farm-light rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4 bg-white">
        {imageDataUrl && (
          <div className="mb-2 animate-scale-in">
            <div className="relative inline-block">
              <img src={imageDataUrl} alt="preview" className="h-16 w-16 object-cover rounded-xl border border-gray-200 shadow-sm" />
              <button onClick={() => { setImageBase64(null); setImageDataUrl(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors">×</button>
            </div>
          </div>
        )}
        <div className="flex items-end gap-2 bg-gray-50 rounded-xl px-4 py-2 border border-gray-200 focus-within:border-farm-light focus-within:ring-2 focus-within:ring-farm-light/20 transition-all duration-200">
          {allowImages && (
            <ImageUpload preview={null}
              onSelect={(b64, dataUrl) => { setImageBase64(b64); setImageDataUrl(dataUrl); }}
              onClear={() => { setImageBase64(null); setImageDataUrl(null); }} />
          )}
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-sm resize-none outline-none py-2 max-h-32 min-h-[40px] leading-relaxed"
            placeholder={placeholder || "Type your message…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
          />
          <button onClick={send} disabled={loading || (!input.trim() && !imageBase64)}
            className="p-2 rounded-lg bg-farm-green text-white disabled:opacity-40 hover:bg-farm-light transition-all duration-200 active:scale-90 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
