import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import prisma from "../services/prisma";
import { streamReplyFromMessages, GEMINI_FAST_MODEL } from "../services/gemini";
import { getWeather, formatWeatherForPrompt } from "../services/weatherService";
import { SessionContext } from "../types/session";

const router = Router();
router.use(requireAuth);

// Lightweight extraction endpoint — does NOT persist to DB
// Must be declared BEFORE /:module to avoid being swallowed by that route
router.post("/extract-items", async (req, res: Response) => {
  const { text } = req.body as { text: string };
  if (!text) { res.json([]); return; }

  try {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    const model = new ChatGoogleGenerativeAI({
      model: GEMINI_FAST_MODEL,
      apiKey: process.env.GEMINI_API_KEY!,
      maxOutputTokens: 256,
    });
    const prompt = `Analyze this farming advice response. If it recommends purchasing anything (fertilizer, compost, seeds, equipment, pesticide, labor etc.), extract and return ONLY a JSON array. If nothing to log, return [].
[{ "description": "Neem oil spray", "category": "fertilizers", "estimatedAmount": 500 }]
Categories must be one of: crops, fertilizers, electricity, labor, equipment, irrigation, other

Response to analyze:
${text}`;

    const result = await model.invoke(prompt);
    const raw = (typeof result.content === "string" ? result.content : JSON.stringify(result.content))
      .trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);
    res.json(Array.isArray(parsed) ? parsed : []);
  } catch {
    res.json([]);
  }
});

router.post("/:module", async (req, res: Response) => {
  const { module } = req.params;
  const userId = (req as unknown as AuthRequest).userId;
  const { sessionId, message, imageBase64, lat, lon } = req.body as {
    sessionId?: string;
    message: string;
    imageBase64?: string;
    lat?: number;
    lon?: number;
  };

  const validModules = ["crop_doctor", "irrigation", "soil_health"];
  if (!validModules.includes(module)) {
    res.status(400).json({ error: "Invalid module" });
    return;
  }

  // Get or create session (scoped to this user)
  let session = sessionId
    ? await prisma.chatSession.findFirst({ where: { id: sessionId, userId } })
    : null;

  if (!session) {
    session = await prisma.chatSession.create({
      data: { module, userId, context: "{}" },
    });
  }

  // Persist user message
  await prisma.message.create({
    data: { sessionId: session.id, role: "user", content: message, imageBase64: imageBase64 ?? null },
  });

  // Load full history for Gemini
  const messages = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  let weatherContext: string | undefined;
  if (lat && lon) {
    try {
      if (module === "irrigation") {
        const weather = await getWeather(lat, lon);
        weatherContext = formatWeatherForPrompt(weather);
      } else {
        // For crop_doctor and soil_health, inject region for region-specific advice
        const { data: geo } = await (await import("axios")).default.get<{
          address?: { city?: string; town?: string; village?: string; state?: string };
        }>(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
          headers: { "User-Agent": "FarmSense-AI/1.0" },
          timeout: 5000,
        });
        const addr = geo.address ?? {};
        const city = addr.city ?? addr.town ?? addr.village ?? "";
        const state = addr.state ?? "";
        if (city || state) {
          weatherContext = `Farmer's region: ${[city, state].filter(Boolean).join(", ")}. Tailor advice to local crops, pests, climate, and agricultural practices of this region.`;
        }
      }
    } catch { /* proceed without location context */ }
  }

  const context: SessionContext = JSON.parse(session.context || "{}");

  // Stream via SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send sessionId first so frontend knows which session to track
  res.write(`data: ${JSON.stringify({ type: "session", sessionId: session.id })}\n\n`);

  const reply = await streamReplyFromMessages(module, messages, context, weatherContext, (token) => {
    res.write(`data: ${JSON.stringify({ type: "token", token })}\n\n`);
  });

  // Persist full reply after streaming completes
  await prisma.message.create({
    data: { sessionId: session.id, role: "assistant", content: reply },
  });

  res.write(`data: ${JSON.stringify({ type: "done", reply })}\n\n`);
  res.end();
});

router.get("/sessions/list", async (req, res: Response) => {
  const userId = (req as unknown as AuthRequest).userId;
  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, module: true, createdAt: true, updatedAt: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, role: true } } },
  });
  res.json(sessions);
});

router.get("/:sessionId", async (req, res: Response) => {
  const userId = (req as unknown as AuthRequest).userId;
  const session = await prisma.chatSession.findFirst({
    where: { id: req.params.sessionId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  res.json(session);
});

router.delete("/:sessionId", async (req, res: Response) => {
  const userId = (req as unknown as AuthRequest).userId;
  const session = await prisma.chatSession.findFirst({ where: { id: req.params.sessionId, userId } });
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  await prisma.chatSession.delete({ where: { id: session.id } });
  res.json({ deleted: true });
});

export default router;
