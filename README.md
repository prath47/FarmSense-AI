# 🌱 FarmSense AI

> Your intelligent farming companion — powered by Gemini 2.5 Flash

FarmSense AI is a full-stack precision agriculture assistant that gives small and mid-size farmers access to expert-level crop disease diagnosis, irrigation scheduling, soil health advice, financial tracking, and proactive weather-aware alerts — all in a conversational interface.

---

## 🚀 What Makes It Different

| Feature | FarmSense AI | Generic AI Chatbot |
|---|---|---|
| Location-aware by default | ✅ Auto-detects GPS, injects region into every prompt | ❌ User must describe location every time |
| Real-time weather in responses | ✅ Open-Meteo API injected into irrigation prompts | ❌ No live data |
| Proactive alerts | ✅ AI scans sessions + 7-day forecast, pushes warnings | ❌ Reactive only |
| Finance loop | ✅ AI recommends → "Log to Tracker" chip → expense logged | ❌ Advice stays in chat |
| Streaming responses | ✅ Token-by-token SSE stream | ❌ Full response wait |
| Multi-module memory | ✅ Persistent sessions per module per user | ❌ Stateless |
| Image diagnosis | ✅ Upload crop photo for disease ID | ❌ Text only |

---

## ✨ Features

### 🌿 Crop Doctor
- Upload a photo or describe symptoms to diagnose plant diseases
- Confidence-rated diagnosis with severity levels (Mild / Moderate / Severe)
- Organic treatments recommended first; chemicals only as last resort
- Region-specific pest and disease advice based on detected location

### 💧 Irrigation Advisor
- Calculates water requirements in liters per acre
- Suggests optimal watering schedules with time-of-day recommendations
- Real-time weather data (temperature, humidity, precipitation, wind) injected into every response
- Flags drought risk and overwatering risk automatically

### 🪱 Soil Health Advisor
- Assesses soil health from description or photo
- Recommends region-specific cover crops
- Composting strategies with timelines
- Designs 3-season crop rotation plans
- Region context injected via auto-detected GPS location

### 📍 Auto Location Detection
- Silent background geolocation on app load
- Reverse geocoding via Nominatim (OpenStreetMap) — no API key needed
- Location pill shown in chat header (`📍 Thane, Maharashtra`)
- Automatically injected into all AI prompts — user never has to type their location

### 🔔 Proactive Alerts
- AI scans your 3 most recent sessions against a 7-day weather forecast
- Generates 2-3 actionable alerts per session (e.g. "Skip watering tomorrow — rain forecast Thursday")
- Alerts cached for 1 hour, generated in parallel to avoid timeouts
- Bell icon 🔔 in top-right with unread count badge
- Alert types: `info`, `warning`, `urgent` with color-coded cards
- Dismissed alerts stored in localStorage — won't reappear

### 💰 Finance Tracker ↔ AI Integration
- After every AI response, a background Gemini call extracts any purchasing recommendations
- "➕ Log to Tracker" chip buttons appear below AI messages
- Click a chip → pre-filled confirmation modal (description, category, amount, date)
- Confirm → POST to tracker, expense logged instantly
- Categories: crops, fertilizers, electricity, labor, equipment, irrigation, other
- Dashboard finance snapshot: Revenue, Expenses, Net Profit, ROI

### ⚡ Streaming Responses
- Backend streams tokens via Server-Sent Events (SSE)
- Frontend renders text word-by-word as it arrives
- Thinking indicator (animated dots) shown until first token
- No more mid-response truncation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Next.js 15)                     │
│                                                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │  Auth Pages  │  │  Chat Modules │  │   Finance Tracker    │ │
│  │  /login      │  │  /crop-doctor │  │   /tracker           │ │
│  │  /register   │  │  /irrigation  │  │   + TransactionForm  │ │
│  └──────────────┘  │  /soil-health │  └──────────────────────┘ │
│                    └───────────────┘                            │
│                            │                                    │
│  ┌─────────────────────────▼──────────────────────────────────┐ │
│  │                   Zustand Store                            │ │
│  │   token · user · location · sessions · dismissedAlerts     │ │
│  │   (persisted to localStorage via zustand/persist)          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────▼──────────────────────────────────┐ │
│  │              useAutoLocation (background)                  │ │
│  │   navigator.geolocation → Nominatim reverse geocode        │ │
│  │   → setLocation({ lat, lon, city, region })                │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTP / SSE
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND (:4000)                     │
│                                                                 │
│  POST /api/chat/:module  ──────────────────────────────────┐   │
│    1. Get/create ChatSession (Prisma)                       │   │
│    2. Persist user message                                  │   │
│    3. Fetch weather (irrigation) or region (others)         │   │
│    4. streamReplyFromMessages() → SSE token stream ─────────┼─► │ stream to browser
│    5. Persist full AI reply                                 │   │
│                                                             │   │
│  POST /api/chat/extract-items                               │   │
│    Gemini fast model → extract purchase JSON                │   │
│    (never persisted to DB)                                  │   │
│                                                             │   │
│  GET  /api/alerts?lat=&lon=                                 │   │
│    Parallel Gemini calls per session + weather forecast     │   │
│    1-hour cache per session                                 │   │
│                                                             │   │
│  GET/POST /api/tracker/transactions                         │   │
│  GET      /api/tracker/summary                              │   │
│  POST/GET /api/auth/*                                       │   │
└──────────────┬──────────────────────────────────────────────────┘
               │
       ┌───────┴───────────────────────┐
       │                               │
       ▼                               ▼
┌──────────────┐              ┌────────────────────┐
│  PostgreSQL  │              │   Gemini 2.5 Flash  │
│  (Prisma)    │              │   (via LangChain)   │
│              │              │                     │
│  User        │              │  • Chat replies     │
│  ChatSession │              │  • Alert generation │
│  Message     │              │  • Item extraction  │
│  Transaction │              │                     │
└──────────────┘              └─────────────────────┘
                                        │
                              ┌─────────┴──────────┐
                              │                    │
                              ▼                    ▼
                     ┌──────────────┐    ┌──────────────────┐
                     │  Open-Meteo  │    │    Nominatim     │
                     │  Weather API │    │  Reverse Geocode │
                     │  (free)      │    │  (OpenStreetMap) │
                     └──────────────┘    └──────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| | |
|---|---|
| **Framework** | Next.js 15 (App Router) + React 19 |
| **State** | Zustand 4.5 with `persist` middleware |
| **Styling** | Tailwind CSS + custom farm color palette |
| **Charts** | Recharts (Pie + Bar) |
| **Markdown** | react-markdown + remark-gfm |
| **Icons** | lucide-react |
| **HTTP** | Native `fetch` with SSE streaming |

### Backend
| | |
|---|---|
| **Runtime** | Node.js + Express 4 |
| **Language** | TypeScript (strict) |
| **Database** | PostgreSQL via Prisma ORM |
| **AI** | Google Gemini 2.5 Flash via `@langchain/google-genai` |
| **Streaming** | Server-Sent Events (SSE) |
| **Auth** | JWT (`jsonwebtoken` + `bcryptjs`) |
| **Weather** | Open-Meteo API (free, no key needed) |
| **Geocoding** | Nominatim / OpenStreetMap (free, no key needed) |

### External APIs (all free, no credit card)
| API | Used For |
|---|---|
| Google Gemini | Chat replies, alert generation, item extraction |
| Open-Meteo | Current weather + 7-day forecast |
| Nominatim (OSM) | Reverse geocoding (lat/lon → city, region) |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Gemini API key (free tier available at [aistudio.google.com](https://aistudio.google.com))

### Installation

```bash
# Clone and install all dependencies
git clone <repo>
cd FarmSense-AI
npm run install:all
```

### Environment Setup

Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/farmsense
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: override AI models
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FAST_MODEL=gemini-2.0-flash
```

### Database Setup

```bash
cd backend
npx prisma migrate dev
```

### Run

```bash
# Terminal 1 — backend on :4000
npm run backend

# Terminal 2 — frontend on :3000
npm run frontend
```

Open [http://localhost:3000](http://localhost:3000), register an account, and start farming smarter.

---

## 📱 Usage Walkthrough

1. **Register / Login** → JWT token stored in localStorage
2. **Allow location** → pill appears in chat header (`📍 Thane, Maharashtra`)
3. **Pick a module** → Crop Doctor, Irrigation Advisor, or Soil Health
4. **Chat** → AI streams responses token-by-token with region + weather context
5. **See "Log to Tracker" chips** → click any expense recommendation to log it
6. **Check alerts bell** 🔔 → weather-aware alerts auto-generated from your sessions
7. **Finance Tracker** → view revenue, expenses, ROI, category breakdown

---

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- All API routes protected by JWT middleware
- Sessions scoped to authenticated user — no cross-user data leakage
- Images stored as base64 in DB (never written to filesystem)

---

## 🗺️ Roadmap

- [ ] Push notifications (Web Push API)
- [ ] Offline mode with service worker
- [ ] Multi-language support (Hindi, Marathi, Tamil)
- [ ] Soil test report PDF upload + OCR
- [ ] Government scheme recommendations by region
- [ ] WhatsApp integration for low-connectivity farmers

---

Built with ❤️ for farmers who deserve better tools.
