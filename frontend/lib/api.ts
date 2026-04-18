import { useAppStore } from "./store";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "") + "/api";

function authHeaders(): HeadersInit {
  const token = useAppStore.getState().token;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    useAppStore.getState().clearAuth();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Request failed");
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function register(name: string, email: string, password: string) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function streamChatMessage(
  opts: {
    module: string;
    sessionId?: string;
    message: string;
    imageBase64?: string;
    lat?: number;
    lon?: number;
  },
  onToken: (token: string) => void,
): Promise<{ sessionId: string; reply: string }> {
  const res = await fetch(`${BASE}/chat/${opts.module}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      sessionId: opts.sessionId,
      message: opts.message,
      imageBase64: opts.imageBase64,
      lat: opts.lat,
      lon: opts.lon,
    }),
  });

  if (res.status === 401) {
    useAppStore.getState().clearAuth();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Request failed");
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let sessionId = "";
  let reply = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const json = JSON.parse(line.slice(6)) as
        | { type: "session"; sessionId: string }
        | { type: "token"; token: string }
        | { type: "done"; reply: string };
      if (json.type === "session") sessionId = json.sessionId;
      else if (json.type === "token") { reply += json.token; onToken(json.token); }
      else if (json.type === "done") reply = json.reply;
    }
  }

  return { sessionId, reply };
}

export async function extractTrackerItems(text: string): Promise<{ description: string; category: string; estimatedAmount: number }[]> {
  const res = await fetch(`${BASE}/chat/extract-items`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ text }),
  });
  return handleResponse(res);
}

export async function getSession(sessionId: string) {
  const res = await fetch(`${BASE}/chat/${sessionId}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function deleteSession(sessionId: string) {
  const res = await fetch(`${BASE}/chat/${sessionId}`, { method: "DELETE", headers: authHeaders() });
  return handleResponse(res);
}

export async function listSessions() {
  const res = await fetch(`${BASE}/chat/sessions/list`, { headers: authHeaders() });
  return handleResponse(res);
}

// ── Tracker ───────────────────────────────────────────────────────────────────

export async function getTrackerSummary() {
  const res = await fetch(`${BASE}/tracker/summary`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function getTransactions(season?: string) {
  const url = season
    ? `${BASE}/tracker/transactions?season=${encodeURIComponent(season)}`
    : `${BASE}/tracker/transactions`;
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse(res);
}

export async function addTransaction(tx: {
  type: string; category: string; amount: number; description: string; date: string; season?: string;
}) {
  const res = await fetch(`${BASE}/tracker/transactions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(tx),
  });
  return handleResponse(res);
}

export async function updateTransaction(id: string, data: Partial<{
  type: string; category: string; amount: number; description: string; date: string; season: string;
}>) {
  const res = await fetch(`${BASE}/tracker/transactions/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteTransaction(id: string) {
  const res = await fetch(`${BASE}/tracker/transactions/${id}`, { method: "DELETE", headers: authHeaders() });
  return handleResponse(res);
}

export async function getAlerts(lat: number, lon: number) {
  const res = await fetch(`${BASE}/alerts?lat=${lat}&lon=${lon}`, { headers: authHeaders() });
  return handleResponse(res);
}
