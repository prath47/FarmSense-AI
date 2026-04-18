import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import prisma from "../services/prisma";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import axios from "axios";
import { GEMINI_FAST_MODEL } from "../services/gemini";

const router = Router();
router.use(requireAuth);

// In-memory cache: sessionId -> { alerts, expiresAt }
const alertCache = new Map<string, { alerts: Alert[]; expiresAt: number }>();

interface Alert {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "urgent";
  module: string;
}

interface ForecastResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    precipitation_sum: number[];
    weathercode: number[];
  };
}

async function fetchForecast(lat: number, lon: number): Promise<string> {
  const { data } = await axios.get<ForecastResponse>("https://api.open-meteo.com/v1/forecast", {
    params: {
      latitude: lat,
      longitude: lon,
      daily: "temperature_2m_max,precipitation_sum,weathercode",
      timezone: "auto",
      forecast_days: 7,
    },
  });
  const { daily } = data;
  return daily.time.map((d, i) =>
    `${d}: max ${daily.temperature_2m_max[i]}°C, rain ${daily.precipitation_sum[i]}mm`
  ).join("; ");
}

function extractJsonArray(text: string): unknown[] {
  // Strip markdown fences
  const cleaned = text.trim().replace(/```json|```/g, "").trim();
  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* fall through to extraction */ }
  // Extract the first [...] block from the response
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
  }
  return [];
}

async function generateAlerts(
  module: string,
  messages: { role: string; content: string }[],
  forecast: string
): Promise<Alert[]> {
  const model = new ChatGoogleGenerativeAI({
    model: GEMINI_FAST_MODEL,
    apiKey: process.env.GEMINI_API_KEY!,
    maxOutputTokens: 1024,
  });

  const msgSummary = messages
    .slice(-3)
    .map((m) => m.content.slice(0, 120))
    .join(" | ");

  const prompt = `You are a farming alert generator. Output ONLY a JSON array, no prose.

Weather (7 days): ${forecast}
Recent farmer queries: ${msgSummary}

Rules:
- Max 2 alerts
- Each title ≤6 words, message ≤15 words
- type must be exactly: warning, info, or urgent

[{"title":"...","message":"...","type":"info","module":"${module}"}]`;

  const result = await model.invoke(prompt);
  const text = typeof result.content === "string" ? result.content : JSON.stringify(result.content);
  const arr = extractJsonArray(text);
  return arr
    .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
    .map((a, i) => ({
      id: `${module}-${Date.now()}-${i}`,
      title: String(a.title ?? "Alert"),
      message: String(a.message ?? ""),
      type: (["warning", "info", "urgent"].includes(String(a.type)) ? a.type : "info") as Alert["type"],
      module: String(a.module ?? module),
    }));
}

router.get("/", async (req, res: Response) => {
  const userId = (req as unknown as AuthRequest).userId;

  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  if (isNaN(lat) || isNaN(lon)) { res.json([]); return; }

  // Only look at 3 most recent sessions with messages
  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });

  const sessionsWithMsgs = sessions.filter((s) => s.messages.length > 0);
  if (sessionsWithMsgs.length === 0) { res.json([]); return; }

  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  // Serve fully-cached result immediately if all sessions are cached
  const allCached = sessionsWithMsgs.every((s) => {
    const c = alertCache.get(s.id);
    return c && c.expiresAt > now;
  });
  if (allCached) {
    const alerts = sessionsWithMsgs.flatMap((s) => alertCache.get(s.id)!.alerts);
    res.json(alerts);
    return;
  }

  // Fetch forecast once for all sessions
  let forecast: string;
  try {
    forecast = await fetchForecast(lat, lon);
  } catch (err) {
    console.error("[alerts] Failed to fetch forecast:", err);
    res.json([]);
    return;
  }

  // Generate alerts for all uncached sessions IN PARALLEL with a per-call timeout
  const results = await Promise.allSettled(
    sessionsWithMsgs.map(async (session) => {
      const cached = alertCache.get(session.id);
      if (cached && cached.expiresAt > now) return cached.alerts;

      // Reverse because we fetched desc; take last 3 user messages only (skip giant AI replies)
      const userMsgs = session.messages
        .filter((m) => m.role === "user")
        .slice(0, 2)
        .reverse()
        .map((m) => `user: ${m.content.slice(0, 120)}`);

      const withTimeout = Promise.race([
        generateAlerts(session.module, userMsgs.map((c) => ({ role: "user", content: c })), forecast),
        new Promise<Alert[]>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 15000)
        ),
      ]);

      const alerts = await withTimeout;
      alertCache.set(session.id, { alerts, expiresAt: now + ONE_HOUR });
      return alerts;
    })
  );

  const allAlerts: Alert[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allAlerts.push(...r.value);
    else console.error("[alerts] Session alert generation failed:", r.reason);
  }

  res.json(allAlerts);
});

export default router;
