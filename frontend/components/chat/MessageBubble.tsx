"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LogToTrackerChip from "./LogToTrackerChip";
import type { TrackerItem } from "./ChatWindow";

interface Props {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
  trackerItems?: TrackerItem[];
}

export default function MessageBubble({ role, content, imageDataUrl, trackerItems }: Props) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 ${isUser ? "animate-slide-in-right" : "animate-slide-in-left"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-farm-green text-white flex items-center justify-center text-xs font-bold mr-2 mt-1 shrink-0 animate-scale-in">
          AI
        </div>
      )}
      <div className={`max-w-[75%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        {imageDataUrl && (
          <img src={imageDataUrl} alt="uploaded" className="max-w-[200px] rounded-xl border border-gray-200 shadow-sm animate-scale-in" />
        )}
        {content && (
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-farm-green text-white rounded-br-sm"
              : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm prose prose-sm max-w-none prose-headings:text-gray-800 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
          }`}>
            {isUser
              ? <span className="whitespace-pre-wrap">{content}</span>
              : <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            }
          </div>
        )}

        {/* Log to Tracker chips — only on AI messages */}
        {!isUser && trackerItems && trackerItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 animate-fade-in">
            {trackerItems.map((item, i) => (
              <LogToTrackerChip key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
